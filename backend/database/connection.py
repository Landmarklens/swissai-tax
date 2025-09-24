"""Database connection module using AWS Parameter Store for credentials"""

import os
import json
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any
from contextlib import contextmanager

# Initialize SSM client
ssm = boto3.client('ssm', region_name='us-east-1')

# Cache for parameters
_param_cache = {}

def get_parameter(name: str, decrypt: bool = False) -> str:
    """Get parameter from AWS Parameter Store with caching"""
    if name not in _param_cache:
        try:
            response = ssm.get_parameter(Name=name, WithDecryption=decrypt)
            _param_cache[name] = response['Parameter']['Value']
        except Exception as e:
            print(f"Error fetching parameter {name}: {e}")
            raise
    return _param_cache[name]

def get_db_config() -> Dict[str, Any]:
    """Get database configuration from environment variables or Parameter Store"""
    # Try environment variables first
    if os.getenv('DATABASE_HOST'):
        return {
            'host': os.getenv('DATABASE_HOST'),
            'port': int(os.getenv('DATABASE_PORT', 5432)),
            'database': os.getenv('DATABASE_NAME', 'swissai_tax'),
            'user': os.getenv('DATABASE_USER', 'postgres'),
            'password': os.getenv('DATABASE_PASSWORD', ''),
            'options': f"-csearch_path={os.getenv('DATABASE_SCHEMA', 'public')}"
        }

    # Fall back to Parameter Store
    return {
        'host': get_parameter('/swissai-tax/db/host'),
        'port': int(get_parameter('/swissai-tax/db/port')),
        'database': get_parameter('/swissai-tax/db/database'),
        'user': get_parameter('/swissai-tax/db/username'),
        'password': get_parameter('/swissai-tax/db/password', decrypt=True),
        'options': f"-csearch_path={get_parameter('/swissai-tax/db/schema')}"
    }

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = None
    try:
        config = get_db_config()
        conn = psycopg2.connect(**config)
        yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

@contextmanager
def get_db_cursor(dict_cursor: bool = True):
    """Context manager for database cursor"""
    with get_db_connection() as conn:
        cursor_factory = RealDictCursor if dict_cursor else None
        cursor = conn.cursor(cursor_factory=cursor_factory)
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()

def execute_query(query: str, params: Optional[tuple] = None, fetch: bool = True) -> Any:
    """Execute a database query"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        if fetch:
            return cursor.fetchall()
        return cursor.rowcount

def execute_one(query: str, params: Optional[tuple] = None) -> Optional[Dict]:
    """Execute query and return single result"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        return cursor.fetchone()

def execute_insert(query: str, params: Optional[tuple] = None, returning: bool = True) -> Any:
    """Execute insert query"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        if returning:
            return cursor.fetchone()
        return cursor.rowcount

def execute_batch(query: str, params_list: list) -> int:
    """Execute batch of queries"""
    with get_db_cursor() as cursor:
        cursor.executemany(query, params_list)
        return cursor.rowcount

# Health check function
def check_db_health() -> bool:
    """Check if database connection is healthy"""
    try:
        result = execute_one("SELECT 1 as health")
        return result and result['health'] == 1
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False
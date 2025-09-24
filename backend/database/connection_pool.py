"""
Database connection pool module for App Runner
Uses connection pooling for persistent connections
"""

import os
import boto3
import logging
from typing import Optional, Dict, Any
from contextlib import contextmanager
from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker
import psycopg2
from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

# Initialize SSM client
ssm = boto3.client('ssm', region_name='us-east-1')

# Cache for parameters
_param_cache = {}
_connection_pool = None
_engine = None

def get_parameter(name: str, decrypt: bool = False) -> str:
    """Get parameter from AWS Parameter Store with caching"""
    if name not in _param_cache:
        try:
            response = ssm.get_parameter(Name=name, WithDecryption=decrypt)
            _param_cache[name] = response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Error fetching parameter {name}: {e}")
            # Fallback to environment variables for local development
            env_name = name.replace('/swissai-tax/', '').replace('/', '_').upper()
            return os.environ.get(env_name, '')
    return _param_cache[name]

def get_db_config() -> Dict[str, Any]:
    """Get database configuration from environment variables or Parameter Store"""
    # Try environment variables first
    if os.getenv('DATABASE_HOST'):
        return {
            'host': os.getenv('DATABASE_HOST'),
            'port': int(os.getenv('DATABASE_PORT', 5432)),
            'database': os.getenv('DATABASE_NAME', 'swissai_tax'),
            'user': os.getenv('DATABASE_USER', 'webscrapinguser'),
            'password': os.getenv('DATABASE_PASSWORD', ''),
            'options': f"-csearch_path={os.getenv('DATABASE_SCHEMA', 'public')}"
        }

    # Fall back to Parameter Store
    return {
        'host': get_parameter('/swissai-tax/db/host') or 'localhost',
        'port': int(get_parameter('/swissai-tax/db/port') or '5432'),
        'database': get_parameter('/swissai-tax/db/database') or 'swissai_tax_db',
        'user': get_parameter('/swissai-tax/db/username') or 'webscrapinguser',
        'password': get_parameter('/swissai-tax/db/password', decrypt=True),
        'options': f"-csearch_path={get_parameter('/swissai-tax/db/schema') or 'swisstax'}"
    }

def get_connection_pool():
    """Get or create connection pool"""
    global _connection_pool

    if _connection_pool is None:
        config = get_db_config()
        try:
            _connection_pool = pg_pool.ThreadedConnectionPool(
                minconn=2,
                maxconn=20,
                host=config['host'],
                port=config['port'],
                database=config['database'],
                user=config['user'],
                password=config['password'],
                options=config['options']
            )
            logger.info("Database connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create connection pool: {e}")
            raise

    return _connection_pool

def get_sqlalchemy_engine():
    """Get SQLAlchemy engine with connection pooling"""
    global _engine

    if _engine is None:
        config = get_db_config()
        database_url = (
            f"postgresql://{config['user']}:{config['password']}@"
            f"{config['host']}:{config['port']}/{config['database']}"
            f"?options={config['options']}"
        )

        _engine = create_engine(
            database_url,
            poolclass=pool.QueuePool,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,  # Verify connections before using
            pool_recycle=3600,   # Recycle connections after 1 hour
        )
        logger.info("SQLAlchemy engine created successfully")

    return _engine

@contextmanager
def get_db_connection():
    """Get a connection from the pool"""
    pool = get_connection_pool()
    conn = None
    try:
        conn = pool.getconn()
        yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            pool.putconn(conn)

@contextmanager
def get_db_cursor(dict_cursor: bool = True):
    """Get a cursor from pooled connection"""
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
    """Execute a database query using connection pool"""
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

def check_db_health() -> bool:
    """Check if database connection is healthy"""
    try:
        result = execute_one("SELECT 1 as health")
        return result and result['health'] == 1
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

def close_connection_pool():
    """Close all connections in the pool"""
    global _connection_pool, _engine

    if _connection_pool:
        _connection_pool.closeall()
        _connection_pool = None
        logger.info("Connection pool closed")

    if _engine:
        _engine.dispose()
        _engine = None
        logger.info("SQLAlchemy engine disposed")
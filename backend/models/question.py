"""Question model and loader for interview system"""

from typing import Dict, List, Optional, Any
from enum import Enum
import yaml
import os

class QuestionType(Enum):
    TEXT = "text"
    NUMBER = "number"
    CURRENCY = "currency"
    DATE = "date"
    YES_NO = "yes_no"
    SINGLE_CHOICE = "single_choice"
    DROPDOWN = "dropdown"
    GROUP = "group"

class Question:
    def __init__(self, data: Dict[str, Any]):
        self.id = data['id']
        self.text = data['text']
        self.type = QuestionType(data['type'])
        self.options = data.get('options', [])
        self.validation = data.get('validation', {})
        self.required = data.get('required', True)
        self.parent = data.get('parent')
        self.branching = data.get('branching', {})
        self.next = data.get('next')
        self.triggers_loop = data.get('triggers_loop')
        self.loop = data.get('loop', False)
        self.fields = data.get('fields', [])

    def get_next_question(self, answer: Any) -> Optional[str]:
        """Determine next question based on answer"""
        if self.branching:
            # Check specific answer branches
            if answer in self.branching:
                return self.branching[answer]
            # Use default branch if exists
            return self.branching.get('default', self.next)
        return self.next

    def validate_answer(self, answer: Any) -> tuple[bool, str]:
        """Validate answer against rules"""
        if self.required and (answer is None or answer == ''):
            return False, "This field is required"

        if self.type == QuestionType.TEXT:
            if 'minLength' in self.validation and len(answer) < self.validation['minLength']:
                return False, f"Minimum length is {self.validation['minLength']}"
            if 'maxLength' in self.validation and len(answer) > self.validation['maxLength']:
                return False, f"Maximum length is {self.validation['maxLength']}"

        elif self.type in [QuestionType.NUMBER, QuestionType.CURRENCY]:
            try:
                value = float(answer)
                if 'min' in self.validation and value < self.validation['min']:
                    return False, f"Minimum value is {self.validation['min']}"
                if 'max' in self.validation and value > self.validation['max']:
                    return False, f"Maximum value is {self.validation['max']}"
            except (TypeError, ValueError):
                return False, "Please enter a valid number"

        elif self.type == QuestionType.DATE:
            # Date validation would be implemented here
            pass

        elif self.type == QuestionType.SINGLE_CHOICE or self.type == QuestionType.DROPDOWN:
            valid_values = [opt['value'] for opt in self.options]
            if answer not in valid_values:
                return False, "Please select a valid option"

        elif self.type == QuestionType.YES_NO:
            if answer not in ['yes', 'no', True, False]:
                return False, "Please select yes or no"

        return True, ""

class QuestionLoader:
    """Load and manage questions from configuration"""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'config',
                'questions.yaml'
            )

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        self.questions = {}
        for q_id, q_data in self.config['questions'].items():
            q_data['id'] = q_id
            self.questions[q_id] = Question(q_data)

        self.document_rules = self.config.get('document_rules', {})

    def get_question(self, question_id: str) -> Optional[Question]:
        """Get a specific question by ID"""
        return self.questions.get(question_id)

    def get_first_question(self) -> Question:
        """Get the first question in the interview"""
        return self.questions['Q01']

    def get_next_questions(self, current_id: str, answer: Any) -> List[str]:
        """Get next question(s) based on current answer"""
        current = self.get_question(current_id)
        if not current:
            return []

        next_id = current.get_next_question(answer)

        # Handle branching that returns a list (like Q01 → married → [Q01a, Q01b, Q01c, Q01d])
        if isinstance(next_id, list):
            return next_id
        elif next_id:
            return [next_id]
        return []

    def get_document_requirements(self, answers: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate document requirements based on answers"""
        required_documents = []

        for rule_id, rule in self.document_rules.items():
            # Evaluate condition
            condition = rule['condition']
            if self._evaluate_condition(condition, answers):
                for doc in rule['documents']:
                    doc_requirement = {
                        'type': doc['type'],
                        'rule': rule_id,
                        'description': rule['description']
                    }

                    # Handle quantity multipliers
                    if 'quantity' in doc:
                        if doc['quantity'] == 'per_employer' and 'Q04' in answers:
                            doc_requirement['quantity'] = int(answers['Q04'])
                        elif doc['quantity'] == 'per_property' and 'Q09a' in answers:
                            doc_requirement['quantity'] = int(answers['Q09a'])
                        else:
                            doc_requirement['quantity'] = 1
                    else:
                        doc_requirement['quantity'] = 1

                    required_documents.append(doc_requirement)

        return required_documents

    def _evaluate_condition(self, condition: str, answers: Dict[str, Any]) -> bool:
        """Evaluate a rule condition against answers"""
        # Simple condition parser
        # Examples: "Q04 > 0", "Q05 == yes", "Q09 == yes"

        parts = condition.split()
        if len(parts) != 3:
            return False

        question_id, operator, value = parts

        if question_id not in answers:
            return False

        answer = answers[question_id]

        # Convert value to appropriate type
        if value.isdigit():
            value = int(value)
        elif value == 'yes':
            value = True
        elif value == 'no':
            value = False

        # Evaluate condition
        if operator == '>':
            return answer > value
        elif operator == '>=':
            return answer >= value
        elif operator == '<':
            return answer < value
        elif operator == '<=':
            return answer <= value
        elif operator == '==':
            return answer == value
        elif operator == '!=':
            return answer != value

        return False
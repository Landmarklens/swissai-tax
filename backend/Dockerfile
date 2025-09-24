FROM public.ecr.aws/lambda/python:3.11

# Copy requirements file
COPY requirements-lambda.txt ${LAMBDA_TASK_ROOT}/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/
COPY services/ ${LAMBDA_TASK_ROOT}/services/
COPY database/ ${LAMBDA_TASK_ROOT}/database/

# Set the CMD to your handler
CMD ["lambda_handler.lambda_handler"]
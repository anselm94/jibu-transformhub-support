from flask import Flask, request, jsonify
import boto3
import os
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configure AWS Textract
AWS_REGION = "us-east-1"
AWS_ACCESS_KEY = "AKIA2EXSPDZ2AOQNTNCI"
AWS_SECRET_KEY = "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"

textract_client = boto3.client(
    'textract',
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

# Configure upload folder and allowed extensions
UPLOAD_FOLDER = "uploads"

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check if the file is part of the request
    if 'photo' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['photo']

    # If no file is selected
    if file.filename == '':
        return jsonify({"error": "No selected file in the request"}), 400

    # Check if the file is allowed
    if file:
        filename = secure_filename(uuid.uuid4().hex + "-" + file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            # Open the image file in binary mode for Textract
            with open(filepath, 'rb') as document:
                response = textract_client.analyze_document(
                    Document={"Bytes": document.read()},
                    FeatureTypes=["TABLES"]
                )

            # Get the text blocks
            blocks_map = {}
            table_blocks = []

            # Extract table and handwritten text information
            for block in response.get('Blocks', []):
                blocks_map[block['Id']] = block
                if block['BlockType'] == 'TABLE':
                    table_blocks.append(block)

            if len(table_blocks) <= 0:
                return jsonify({"error": "No tables found in the document"}), 400
            
            tables = []
            for index, rows in enumerate(table_blocks):
                rows = generate_table_rows(rows, blocks_map)
                tables.append({
                    "tableId": index,
                    "rows": rows
                })
            
            return jsonify({"tables": tables}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    else:
        return jsonify({"error": "File type not allowed"}), 400

def generate_table_rows(table_result, blocks_map):
    row_columns_map, _ = get_rows_columns_map(table_result, blocks_map)
    rows = []
    cells = []

    for rowIndex, cols in row_columns_map.items():
        for _, text in cols.items():
            cells.append('{}'.format(text))
        rows.append({
            "rowId": rowIndex,
            "cells": cells
        })
        cells = []
    return rows

def get_rows_columns_map(table_result, blocks_map):
    rows = {}
    scores = []
    for relationship in table_result['Relationships']:
        if relationship['Type'] == 'CHILD':
            for child_id in relationship['Ids']:
                cell = blocks_map[child_id]
                if cell['BlockType'] == 'CELL':
                    row_index = cell['RowIndex']
                    col_index = cell['ColumnIndex']
                    if row_index not in rows:
                        # create new row
                        rows[row_index] = {}
                    
                    # get confidence score
                    scores.append(str(cell['Confidence']))
                        
                    # get the text value
                    rows[row_index][col_index] = get_text(cell, blocks_map)
    return rows, scores

def get_text(result, blocks_map):
    text = ''
    if 'Relationships' in result:
        for relationship in result['Relationships']:
            if relationship['Type'] == 'CHILD':
                for child_id in relationship['Ids']:
                    word = blocks_map[child_id]
                    if word['BlockType'] == 'WORD':
                        if "," in word['Text'] and word['Text'].replace(",", "").isnumeric():
                            text += '"' + word['Text'] + '"' + ' '
                        else:
                            text += word['Text'] + ' '
                    if word['BlockType'] == 'SELECTION_ELEMENT':
                        if word['SelectionStatus'] =='SELECTED':
                            text +=  'X '
    return text

if __name__ == '__main__':
    app.run(debug=True)

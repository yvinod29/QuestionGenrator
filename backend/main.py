from flask import Flask, request, jsonify
from langchain.llms import OpenAI
from langchain.schema import HumanMessage
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ... (other code remains the same)

@app.route('/post_data', methods=['POST'])
def post_data():
    data = request.get_json()  # Get the JSON data from the POST request
    print('Received data from front end:', data)
    # Send a response back to the front end
    response_data = generate_question_route(data)
    return response_data

def generate_question_route(data):
    try:
        # Ensure data is a string
        input_text ="generate questions with this data"+ str(data.get('text', ''))

        # Initialize the OpenAI client with your API key
        llm = OpenAI(openai_api_key="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")
        messages = [HumanMessage(content=input_text)]
        # Use the OpenAI instance to generate predictions
        response =  llm.predict_messages(messages)# Adjust max_tokens as needed

        # Extract the generated text from the response
        generated_text = str(response)
        print(type(response))

        return jsonify({'question': generated_text})
    except Exception as e:
        return jsonify({'error': str(e)})



# ... (other code remains the same)

if __name__ == '__main__':
    app.run(port=5000)  # Change the port as needed

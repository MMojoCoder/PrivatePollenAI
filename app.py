from flask import Flask, render_template, request
import csv, datetime, time

app = Flask(__name__)

@app.route('/')
def chat():
    return render_template('/chat.html')

@app.route('/contact-support',  methods=['POST'])
def contactSupport():
    data = request.get_json()

    with open('storage/support.csv', 'w') as file:
        writer = csv.writer(file)
        writer.writerow([datetime.datetime.fromtimestamp(time.time()), data['message']])

    response = {
        'status': 'success',
    }
    
    return response

@app.route('/submit-feedback',  methods=['POST'])
def submitFeedback():
    data = request.get_json()

    with open('storage/feedback.csv', 'w') as file:
        writer = csv.writer(file)
        writer.writerow([datetime.datetime.fromtimestamp(time.time()), data['message']])
    
    response = {
        'status': 'success',
    }
    
    return response


if __name__ == '__main__':
    app.run(debug=True, port=5001)
from flask import Flask, render_template
from waitress import serve

app = Flask(__name__)

@app.route('/')
def chat():
    return render_template('/chat.html')

if __name__ == '__main__':
    serve(app, host="0.0.0.0",port=5001)


from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

DATABASE = "users.db"


def get_db():
    return sqlite3.connect(DATABASE)



@app.route("/login", methods=["POST"])
def login():
    username = request.json.get("username")
    password = request.json.get("password")

    conn = get_db()
    cursor = conn.cursor()

   
    query = (
        f"SELECT * FROM users "
        f"WHERE username = '{username}' "
        f"AND password = '{password}'"
    )

    cursor.execute(query)
    result = cursor.fetchone()

    conn.close()

    if result:
        return jsonify({"message": "Login successful"})

    return jsonify({"message": "Invalid credentials"})



@app.route("/search", methods=["GET"])
def search():
    name = request.args.get("name")

    conn = get_db()
    cursor = conn.cursor()


    query = f"SELECT * FROM users WHERE username LIKE '%{name}%'"

    cursor.execute(query)
    results = cursor.fetchall()

    conn.close()

    return jsonify({"results": results})



@app.route("/user/<user_id>", methods=["GET"])
def get_user(user_id):

    conn = get_db()
    cursor = conn.cursor()


    query = f"SELECT * FROM users WHERE id = {user_id}"

    cursor.execute(query)
    result = cursor.fetchone()

    conn.close()

    return jsonify({"user": result})


if __name__ == "__main__":
    app.run(debug=True)

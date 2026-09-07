from flask import Flask, request, jsonify
import mysql.connector
import os
import requests

app = Flask(__name__)

def get_db():
    try:
        return mysql.connector.connect(
            host=os.environ.get("MYSQL_HOST", "localhost"),
            user="root",
            password="rootpassword",
            database="service_a_db"
        )
    except Exception as e:
        print(f"DB Error: {e}")
        return None

def init_db():
    db = get_db()
    if db:
        cursor = db.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))")
        db.commit()
        cursor.close()
        db.close()

@app.route('/data', methods=['GET', 'POST'])
def handle_data():
    db = get_db()
    if not db:
        return jsonify({"error": "Database unavailable"}), 500

    if request.method == 'POST':
        payload = request.json or {}
        item_name = payload.get('name', 'Default Item')

        cursor = db.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))")
        cursor.execute("INSERT INTO items (name) VALUES (%s)", (item_name,))
        db.commit()
        cursor.close()

        # Sync to Service B & C
        for url in [os.environ.get("SERVICE_B_SYNC_URL"), os.environ.get("SERVICE_C_SYNC_URL")]:
            if url:
                try:
                    requests.post(url, json={"name": item_name}, timeout=2)
                except Exception as e:
                    print(f"Sync failed for {url}: {e}")

        return jsonify({"status": "success", "inserted": item_name}), 201

    # GET Request
    cursor = db.cursor(dictionary=True)
    cursor.execute("CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))")
    cursor.execute("SELECT * FROM items")
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify({"service": "Service A (Flask)", "items": rows}), 200

@app.route('/sync', methods=['POST'])
def receive_sync():
    payload = request.json or {}
    item_name = payload.get('name')
    db = get_db()
    if db:
        cursor = db.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))")
        cursor.execute("INSERT INTO items (name) VALUES (%s)", (item_name,))
        db.commit()
        cursor.close()
        db.close()
    return jsonify({"status": "synced_to_a"}), 200

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
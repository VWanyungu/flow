import json
import uuid
import threading
import time
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from index import downloadFromYoutube, analyse, buildGraph, minimumSpanningTree, visualizegGaph, clearFolder, serialize, deserialize

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Task registry for tracking asynchronous job statuses
tasks = {}
task_lock = threading.Lock()

def send_webhook(webhook_url, payload):
    target_url = webhook_url if webhook_url else "http://localhost:5000/webhook"
    try:
        response = requests.post(target_url, json=payload, timeout=10)
        print(f"[Webhook] Sent payload to {target_url}, status code: {response.status_code}")
    except Exception as err:
        print(f"[Webhook Error] Failed to send webhook to {target_url}: {err}")

def parse_request_data(req):
    data = req.get_json(silent=True)
    webhook_url = req.headers.get("X-Webhook-Url")
    
    if isinstance(data, list):
        return data, webhook_url
    elif isinstance(data, dict):
        tracks = data.get("tracks", data.get("songs", data.get("graph", data)))
        webhook = data.get("webhook_url", webhook_url)
        return tracks, webhook
    return data, webhook_url


@app.route('/webhook', methods=['POST'])
def webhook_receiver():
    try:
        payload = request.get_json()
        print(f"[Webhook Receiver] Received event: {payload.get('event')} for task_id: {payload.get('task_id')}")
        
        task_id = payload.get("task_id")
        if task_id:
            with task_lock:
                if task_id in tasks:
                    tasks[task_id]["last_webhook_event"] = payload
                    
        return jsonify({"received": True, "message": "Webhook payload received successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    with task_lock:
        task = tasks.get(task_id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        return jsonify({'task': task}), 200


def run_download_async(task_id, tracks, webhook_url):
    try:
        with task_lock:
            tasks[task_id]["status"] = "processing"
            tasks[task_id]["step"] = "download"

        summary = downloadFromYoutube(tracks)
        
        with task_lock:
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["download_summary"] = summary
            if summary.get("failed"):
                tasks[task_id]["warning"] = f"Failed to download {len(summary['failed'])} song(s): {', '.join(summary['failed'])}"

        send_webhook(webhook_url, {
            "event": "download_completed",
            "task_id": task_id,
            "step": "download",
            "status": "completed",
            "download_summary": summary,
            "warning": tasks[task_id].get("warning"),
            "timestamp": time.time()
        })
    except Exception as e:
        with task_lock:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = str(e)
        send_webhook(webhook_url, {
            "event": "download_failed",
            "task_id": task_id,
            "step": "download",
            "status": "failed",
            "error": str(e),
            "timestamp": time.time()
        })


@app.route('/download', methods=['POST'])
def downloadSongs():
    try:
        tracks, webhook_url = parse_request_data(request)
        if not tracks:
            return jsonify({'error': 'Invalid input, expected track data'}), 400

        task_id = str(uuid.uuid4())
        with task_lock:
            tasks[task_id] = {
                "task_id": task_id,
                "status": "pending",
                "step": "download",
                "webhook_url": webhook_url,
                "created_at": time.time()
            }

        thread = threading.Thread(target=run_download_async, args=(task_id, tracks, webhook_url))
        thread.daemon = True
        thread.start()

        return jsonify({
            'message': 'Download started asynchronously',
            'status': 'processing',
            'task_id': task_id
        }), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def run_analyse_async(task_id, tracks, webhook_url):
    try:
        with task_lock:
            tasks[task_id]["status"] = "processing"
            tasks[task_id]["step"] = "analyse"

        songs = analyse("songs", tracks, "mp3")
        serialized_songs = serialize(songs)
        clearFolder("songs")

        with task_lock:
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["songs"] = serialized_songs

        send_webhook(webhook_url, {
            "event": "analyse_completed",
            "task_id": task_id,
            "step": "analyse",
            "status": "completed",
            "songs": serialized_songs,
            "timestamp": time.time()
        })
    except Exception as e:
        with task_lock:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = str(e)
        send_webhook(webhook_url, {
            "event": "analyse_failed",
            "task_id": task_id,
            "step": "analyse",
            "status": "failed",
            "error": str(e),
            "timestamp": time.time()
        })


@app.route('/analyse', methods=['POST'])
def analyseSongs():
    try:
        tracks, webhook_url = parse_request_data(request)
        if not tracks:
            return jsonify({'error': 'Invalid input, expected song data'}), 400

        task_id = str(uuid.uuid4())
        with task_lock:
            tasks[task_id] = {
                "task_id": task_id,
                "status": "pending",
                "step": "analyse",
                "webhook_url": webhook_url,
                "created_at": time.time()
            }

        thread = threading.Thread(target=run_analyse_async, args=(task_id, tracks, webhook_url))
        thread.daemon = True
        thread.start()

        return jsonify({
            'message': 'Song analysis started asynchronously',
            'status': 'processing',
            'task_id': task_id
        }), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def run_graph_async(task_id, songs, webhook_url):
    weights = [1, 1, 1, 1, 1]
    try:
        with task_lock:
            tasks[task_id]["status"] = "processing"
            tasks[task_id]["step"] = "graph"

        graph = buildGraph(songs, weights)

        with task_lock:
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["graph"] = graph

        send_webhook(webhook_url, {
            "event": "graph_completed",
            "task_id": task_id,
            "step": "graph",
            "status": "completed",
            "graph": graph,
            "timestamp": time.time()
        })
    except Exception as e:
        with task_lock:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = str(e)
        send_webhook(webhook_url, {
            "event": "graph_failed",
            "task_id": task_id,
            "step": "graph",
            "status": "failed",
            "error": str(e),
            "timestamp": time.time()
        })


@app.route('/graph', methods=['POST'])
def graphSongs():
    try:
        songs, webhook_url = parse_request_data(request)
        if not songs:
            return jsonify({'error': 'Invalid input, expected song data'}), 400

        task_id = str(uuid.uuid4())
        with task_lock:
            tasks[task_id] = {
                "task_id": task_id,
                "status": "pending",
                "step": "graph",
                "webhook_url": webhook_url,
                "created_at": time.time()
            }

        thread = threading.Thread(target=run_graph_async, args=(task_id, songs, webhook_url))
        thread.daemon = True
        thread.start()

        return jsonify({
            'message': 'Graph building started asynchronously',
            'status': 'processing',
            'task_id': task_id
        }), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def run_mst_async(task_id, graph, webhook_url):
    try:
        with task_lock:
            tasks[task_id]["status"] = "processing"
            tasks[task_id]["step"] = "mst"

        mst = minimumSpanningTree(graph)

        with task_lock:
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["mst"] = mst

        send_webhook(webhook_url, {
            "event": "mst_completed",
            "task_id": task_id,
            "step": "mst",
            "status": "completed",
            "mst": mst,
            "timestamp": time.time()
        })
    except Exception as e:
        with task_lock:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = str(e)
        send_webhook(webhook_url, {
            "event": "mst_failed",
            "task_id": task_id,
            "step": "mst",
            "status": "failed",
            "error": str(e),
            "timestamp": time.time()
        })


@app.route('/mst', methods=['POST'])
def mstSongs():
    try:
        graph, webhook_url = parse_request_data(request)
        if not graph:
            return jsonify({'error': 'Invalid input, expected graph data'}), 400

        task_id = str(uuid.uuid4())
        with task_lock:
            tasks[task_id] = {
                "task_id": task_id,
                "status": "pending",
                "step": "mst",
                "webhook_url": webhook_url,
                "created_at": time.time()
            }

        thread = threading.Thread(target=run_mst_async, args=(task_id, graph, webhook_url))
        thread.daemon = True
        thread.start()

        return jsonify({
            'message': 'MST calculation started asynchronously',
            'status': 'processing',
            'task_id': task_id
        }), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def run_pipeline_async(task_id, tracks, webhook_url):
    weights = [1, 1, 1, 1, 1]
    try:
        # Step 1: Download
        with task_lock:
            tasks[task_id]["status"] = "processing"
            tasks[task_id]["step"] = "download"

        download_summary = downloadFromYoutube(tracks)
        send_webhook(webhook_url, {
            "event": "download_completed",
            "task_id": task_id,
            "step": "download",
            "status": "completed",
            "download_summary": download_summary,
            "timestamp": time.time()
        })

        # Step 2: Analyse
        with task_lock:
            tasks[task_id]["step"] = "analyse"

        songs = analyse("songs", tracks, "mp3")
        serialized_songs = serialize(songs)
        clearFolder("songs")
        
        with task_lock:
            tasks[task_id]["songs"] = serialized_songs

        send_webhook(webhook_url, {
            "event": "analyse_completed",
            "task_id": task_id,
            "step": "analyse",
            "status": "completed",
            "songs": serialized_songs,
            "timestamp": time.time()
        })

        # Step 3: Compare / Graph
        with task_lock:
            tasks[task_id]["step"] = "graph"

        graph = buildGraph(serialized_songs, weights)
        with task_lock:
            tasks[task_id]["graph"] = graph

        send_webhook(webhook_url, {
            "event": "graph_completed",
            "task_id": task_id,
            "step": "graph",
            "status": "completed",
            "graph": graph,
            "timestamp": time.time()
        })

        # Step 4: Optimize / MST
        with task_lock:
            tasks[task_id]["step"] = "mst"

        mst = minimumSpanningTree(graph)
        with task_lock:
            tasks[task_id]["mst"] = mst
            tasks[task_id]["status"] = "completed"

        send_webhook(webhook_url, {
            "event": "mst_completed",
            "task_id": task_id,
            "step": "mst",
            "status": "completed",
            "mst": mst,
            "timestamp": time.time()
        })

    except Exception as e:
        with task_lock:
            tasks[task_id]["status"] = "failed"
            tasks[task_id]["error"] = str(e)
        send_webhook(webhook_url, {
            "event": "pipeline_failed",
            "task_id": task_id,
            "status": "failed",
            "error": str(e),
            "timestamp": time.time()
        })


@app.route('/pipeline', methods=['POST'])
def pipeline():
    try:
        tracks, webhook_url = parse_request_data(request)
        if not tracks:
            return jsonify({'error': 'Invalid input, expected track list'}), 400

        task_id = str(uuid.uuid4())
        with task_lock:
            tasks[task_id] = {
                "task_id": task_id,
                "status": "pending",
                "step": "download",
                "webhook_url": webhook_url,
                "created_at": time.time()
            }

        thread = threading.Thread(target=run_pipeline_async, args=(task_id, tracks, webhook_url))
        thread.daemon = True
        thread.start()

        return jsonify({
            'message': 'Pipeline started asynchronously',
            'status': 'processing',
            'task_id': task_id
        }), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/config', methods=['GET'])
def config():
    try:
        config = {
            "REACT_APP_SPOTIFY_CLIENT_ID": "41217831f42a45ffa6c96d4dc51b4c61",
            "REACT_APP_SPOTIFY_CLIENT_SECRET": "9066c749df1e4546a493cde2466bfa5c",
            "REACT_APP_SPOTIFY_REDIRECT_URI": "http://localhost:5173",
            "REACT_APP_SPOTIFY_SCOPE": "user-read-private user-read-email playlist-modify-public playlist-modify-private",
            "REACT_APP_SPOTIFY_AUTH_URL": "https://accounts.spotify.com/authorize",
        }

        return jsonify({'config': config}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
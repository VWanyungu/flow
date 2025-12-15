import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from index import downloadFromYoutube, analyse, buildGraph, minimumSpanningTree, visualizegGaph, clearFolder, serialize, deserialize
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/download', methods=['POST'])
def downloadSongs():
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'error': 'Invalid input, expected a list of dictionaries'}), 400

        for record in data:
            if not isinstance(record, dict):
                return jsonify({'error': 'Invalid input, each item in the list should be a dictionary'}), 400

        # clearFolder("songs")
        downloadFromYoutube(data)

        # songs = analyse("songs", data, "mp3")

        # graph = buildGraph(songs, weights)

        # mst = minimumSpanningTree(graph)

        # visualizegGaph(graph)
        return jsonify({'message': "Downloads successful"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyse', methods=['POST'])
def analyseSongs():
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'error': 'Invalid input, expected a list of dictionaries'}), 400

        for record in data:
            if not isinstance(record, dict):
                return jsonify({'error': 'Invalid input, each item in the list should be a dictionary'}), 400

        songs = analyse("songs", data, "mp3")

        serailzedSongs = serialize(songs)

        return jsonify({'message': "Song analysis done successfully", "songs": serailzedSongs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/graph', methods=['POST'])
def graphSongs():
    weights = [1, 1, 1, 1, 1]
    graph = {}
    try:
        songs = request.get_json()

        graph = buildGraph(songs, weights)

        return jsonify({'message': "Weighted graph created successfuly", "graph": graph}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/mst', methods=['POST'])
def mstSongs():
    try:
        graph = request.get_json()

        mst = minimumSpanningTree(graph)

        return jsonify({'message': "MST calculated successfully", "mst": mst}), 200
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
    
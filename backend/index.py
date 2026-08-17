import sys
import subprocess
import numpy as np
from numpy import float32
import librosa
from scipy.spatial.distance import cosine
from itertools import combinations
import os
import networkx as nx
import matplotlib.pyplot as plt
import heapq
import concurrent.futures
import time
import shutil
import pprint
from concurrent.futures import ProcessPoolExecutor
from songsAnalysis import analyzed_songs

# Function to delete all files in a folder
def clearFolder(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')

def serialize(obj):
    if obj is Ellipsis or type(obj) is type(Ellipsis):
        return None
    elif isinstance(obj, np.ndarray):
        return [serialize(i) for i in obj.tolist()]
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize(i) for i in obj]
    return obj

def deserialize(obj):
    if obj is None:
        return Ellipsis
    elif isinstance(obj, float):
        return np.float32(obj)  # Convert float back to np.float32
    elif isinstance(obj, list):
        # Check if the list can be converted back to a numpy array
        if all(isinstance(i, (int, float)) for i in obj):
            return np.array(obj)  # Convert list back to np.ndarray
        else:
            return [deserialize(i) for i in obj]  # Recursively deserialize nested lists
    elif isinstance(obj, dict):
        return {k: deserialize(v) for k, v in obj.items()}  # Recursively deserialize nested dictionaries
    return obj  # Return the object as-is if no transformation is needed

# Function to download songs from YouTube
def downloadFromYoutube(songsObject):
    print("\n\n1. Downloading songs from YouTube...") 

    cache_map = {s["fileName"]: s for s in analyzed_songs}

    os.makedirs("./songs", exist_ok=True)
    existing_files = os.listdir("./songs")

    downloaded = []
    skipped = []
    failed = []
    
    for item in songsObject:
        exists = False

        for filename in cache_map:
            if item["songName"].lower() in filename.lower():
                 print(f"   > Skipping: {item['songName']} (already analysed)")
                 skipped.append(item['songName'])
                 exists = True
                 break
            
        if not exists:
            for filename in existing_files:
                if item["songName"].lower() in filename.lower():
                    print(f"   > Skipping: {item['songName']} (already downloaded)")
                    skipped.append(item['songName'])
                    exists = True
                    break
        
        if exists:
            continue

        search_query = f"ytsearch1:{item['artist']} {item['songName']}"
        try:
            result = subprocess.run([
                sys.executable, "-m", "yt_dlp",
                "--no-check-certificates",
                "-f", "bestaudio",
                "-x",  # Extract audio
                "--audio-format", "mp3",  # Convert to MP3
                "-o", "./songs/%(title)s.%(ext)s",  # Output directory and filename template
                search_query,
            ], capture_output=True, text=True)

            if result.returncode != 0:
                print(f"   > Error downloading {item['songName']}: {result.stderr}")
                failed.append(item['songName'])
            else:
                print(f"   > Downloaded: {item['songName']} by {item['artist']}")
                downloaded.append(item['songName'])
        except Exception as err:
            print(f"   > Exception downloading {item['songName']}: {err}")
            failed.append(item['songName'])

    print("---> All downloads completed processing!")
    return {
        "success": True,
        "downloaded": downloaded,
        "skipped": skipped,
        "failed": failed
    }
            

# Get characteristics of each song in the folder with extension extensions
def analyse(folder, listOfSongsToDownload, extensions=("mp3")):
    print("\n2. Analysing songs...")
    
    # get characteristics of each song
    def analyseSong(file, filename):
        y, sr = librosa.load(file)

        def getBpm():
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            return np.round(tempo[0])

        def getKey():
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            key = np.argmax(chroma.mean(axis=1))  # Get the most dominant key
            return int(key)

        def getLoudness():
            rms = librosa.feature.rms(y=y)
            return np.round(np.mean(rms),2)
        
        def getMfcc():
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            return np.round(np.mean(mfccs, axis=1),2)  # Average MFCC values

        def getOnsets():
            onsets = librosa.onset.onset_detect(y=y, sr=sr, backtrack=True)
            return np.round(librosa.frames_to_time(onsets, sr=sr),2)
    
        return {
            "uri": item["uri"],
            "fileName": filename,
            "bpm": getBpm(),
            "key": getKey(),
            "loudness": getLoudness(),
            "mfcc": getMfcc(),
            "onsets": getOnsets(),
        }
                
    songs = []
    updated_cache = False
    cache_map = {s["uri"]: s for s in analyzed_songs}
    
    # Get all files in the folder to match against
    files_in_folder = []
    if os.path.exists(folder):
        files_in_folder = [f for f in os.listdir(folder) if f.lower().endswith(extensions)]

    for item in listOfSongsToDownload:
        # Check cache
        if item["uri"] in cache_map:
            print(f"   > Loaded from cache: {item['songName']}")
            songs.append(cache_map[item["uri"]])
            continue

        # If not in cache, find matching file
        matching_file = None
        matching_filename = None
        
        for fname in files_in_folder:
            if item["songName"].lower() in fname.lower():
                matching_filename = fname
                matching_file = os.path.join(folder, fname)
                break
        
        if matching_file:
            # Analyze the song
            song = analyseSong(matching_file, matching_filename)
            
            if song:
                songs.append(song)
                analyzed_songs.append(song)
                # Update map
                cache_map[item["uri"]] = song
                updated_cache = True
                print(f"   > Processed: {matching_filename}")
        else:
             print(f"   > Warning: File for '{item['songName']}' not found in '{folder}'. Skipping analysis.")

    if updated_cache:
        try:
            with open("songsAnalysis.py", "w") as f:
                f.write(f"analyzed_songs = {pprint.pformat(analyzed_songs)}")
            print("---> Cache updated in songsAnalysis.py")
        except Exception as e:
            print(f"---> Failed to update cache: {e}")

    print("---> All songs analysed successfully!")

    return songs


def getEdgeWeights(songA, songB, weights):
    bpmA = float(songA.get("bpm", 120))
    bpmB = float(songB.get("bpm", 120))
    keyA = float(songA.get("key", 0))
    keyB = float(songB.get("key", 0))
    loudnessA = float(songA.get("loudness", 0))
    loudnessB = float(songB.get("loudness", 0))

    bpm_diff = abs(bpmA - bpmB)
    key_diff = min(abs(keyA - keyB), 12 - abs(keyA - keyB))
    loudness_diff = abs(loudnessA - loudnessB)

    mfccA = np.array([x for x in songA.get("mfcc", []) if isinstance(x, (int, float, np.number)) and x is not None], dtype=float)
    mfccB = np.array([x for x in songB.get("mfcc", []) if isinstance(x, (int, float, np.number)) and x is not None], dtype=float)

    if len(mfccA) > 0 and len(mfccB) > 0 and len(mfccA) == len(mfccB):
        energy_diff = float(cosine(mfccA, mfccB))
        if np.isnan(energy_diff):
            energy_diff = 0.0
    else:
        energy_diff = 0.0

    onsetsA = [float(x) for x in songA.get("onsets", []) if isinstance(x, (int, float, np.number)) and x is not None]
    onsetsB = [float(x) for x in songB.get("onsets", []) if isinstance(x, (int, float, np.number)) and x is not None]

    max_length = max(len(onsetsA), len(onsetsB))
    paddedA = np.pad(onsetsA, (0, max(0, max_length - len(onsetsA))), 'constant')
    paddedB = np.pad(onsetsB, (0, max(0, max_length - len(onsetsB))), 'constant')

    rhythm_diff = float(np.linalg.norm(paddedA - paddedB))

    return float(weights[0] * bpm_diff + weights[1] * key_diff + weights[2] * loudness_diff + weights[3] * energy_diff + weights[4] * rhythm_diff)

def buildGraph(songs, weights):
    print("\n3. Building graph...")

    graph = {}

    for i, j in combinations(range(len(songs)), 2):  # Pairwise index combinations
        songA, songB = songs[i], songs[j]
        # print(f"   Processing pair: {i}, {j}")
        # print(f"   songA: {songA["fileName"]}")
        # print(f"   songB: {songB["fileName"]}")
        weight = getEdgeWeights(songA, songB, weights)
        # print(f"   Weight: {weight}\n")

        if weight is not None:  # Ensure weight calculation didn't fail
            graph.setdefault(songs[i]["uri"], {})[songs[j]["uri"]] = float(weight)
            graph.setdefault(songs[j]["uri"], {})[songs[i]["uri"]] = float(weight)  # Ensure undirected graph
    
    print("---> All edges calculated!")

    return graph

def visualizegGaph(graph):
    # # Create a graph from the adjacency dictionary
    G = nx.Graph(graph)

    for node, edges in graph.items():
        for neighbor, weight in edges.items():
            G.add_edge(node, neighbor, weight=float(weight))

    plt.figure(figsize=(12, 7))
    pos = nx.spring_layout(G, seed=42)

    # Draw nodes and edges
    nx.draw(G, pos, with_labels=True, node_size=3000, node_color="lightblue", font_size=9, edge_color="gray")

    # Extract edge labels (weights)
    edge_labels = {(u, v): f"{G[u][v]['weight']:.2f}" for u, v in G.edges()}
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_size=9, font_color="red")

    plt.title("Song Graph with Edge Weights")
    plt.show()


def minimumSpanningTree(graph):
    print("\n4. Calculating Minimum Spanning Tree (MST)...")

    if not graph:
        print("---> Graph is empty! Returning empty MST.")
        return []

    startNode = next(iter(graph))  # Pick an arbitrary starting node
    mst = []
    visited = set([startNode])
    minHeap = [(cost, startNode, neighbor) for neighbor, cost in graph[startNode].items()]
    heapq.heapify(minHeap)  # Convert edges to a min-heap
    mst.append(startNode)
    
    while minHeap and len(visited) < len(graph):
        cost, frm, to = heapq.heappop(minHeap)  # Get the smallest edge
        if to in visited:
            continue  # Ignore if node is already in MST
        visited.add(to)
        mst.append(to)

        for neighbor, edge_cost in graph[to].items():
            if neighbor not in visited:
                heapq.heappush(minHeap, (edge_cost, to, neighbor))

    print("---> MST calculated successfully!")
    print("\n\nMST", mst)

    return mst
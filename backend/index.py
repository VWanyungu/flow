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
    if isinstance(obj, np.float32):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize(i) for i in obj]
    return obj

def deserialize(obj):
    if isinstance(obj, float):
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

    existing_files = []
    if os.path.exists("./songs"):
        existing_files = os.listdir("./songs")

    all_successful = True
    
    for item in songsObject:
        # Check if song exists
        exists = False

        for filename in cache_map:
            if item["songName"].lower() in filename.lower():
                 print(f"   > Skipping: {item['songName']} (already analysed)")
                 exists = True
                 break
            
        if (exists == False):
            for filename in existing_files:
                if item["songName"].lower() in filename.lower():
                    print(f"   > Skipping: {item['songName']} (already downloaded)")
                    exists = True
                    break
        
        if exists:
            continue


        search_query = f"ytsearch1:{item['artist']} {item['songName']}"
        result = subprocess.run([
            sys.executable, "-m", "yt_dlp",
            "-f", "bestaudio",
            "-x",  # Extract audio
            "--audio-format", "mp3",  # Convert to MP3
            "-o", "./songs/%(title)s.%(ext)s",  # Output directory and filename template
            search_query,
            # "--ffmpeg-location", "/usr/bin/ffmpeg",  # Full path to ffmpeg on Ubuntu
        ], capture_output=True, text=True)

        if result.returncode != 0:
            print(f"   > Error downloading {item['songName']}: {result.stderr}")
            all_successful = False
        else:
            print(f"   > Downloaded: {item['songName']} by {item['artist']}")

    print("---> All downloads are complete!")
    return all_successful
            

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
    def fillArray(arr, target_length):
        return np.pad(arr, (0, max(0, target_length - len(arr))), 'constant')
    max_length = max(len(songA["onsets"]), len(songB["onsets"]))
    songA["onsets"] = fillArray(songA["onsets"], max_length)
    songB["onsets"] = fillArray(songB["onsets"], max_length)

    bpm_diff = abs(songA["bpm"] - songB["bpm"])
    key_diff = min(abs(songA["key"] - songB["key"]), 12 - abs(songA["key"] - songB["key"]))
    loudness_diff = abs(songA["loudness"] - songB["loudness"])
    energy_diff = cosine(songA["mfcc"], songB["mfcc"])
    rhythm_diff = np.linalg.norm(np.array(songA["onsets"]) - np.array(songB["onsets"]))

    return (weights[0] * bpm_diff + weights[1] * key_diff + weights[2] * loudness_diff + weights[3] * energy_diff + weights[4] * rhythm_diff )

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
# Getting started

Activate venv
python3 -m venv flowenv
source ./flowenv/bin/activate

run which python3/ which pip to confirm the venv has been activated

Install dependencies
./flowenv/bin/python3 -m pip install --no-cache-dir -r requirements.txt

# Run the application
./flowenv/bin/python3 server.py

# The server will start on http://127.0.0.1:5000

# Downloading the songs
- Run the function:
    downloadFromYoutube()
- The function takes 1 parameters:
    1. songsObject: a list of dictionaries containing the songs to be optimized e.g
    [{
        "songName": "Summers Over Interlude",
        "artist": "Drake",
        "uri": "spotify:track:3ppVO2tyWRRznNmONvt7Se"
    }]
- The function uses yt-dlp and subprocess to download the songs from youtube:
    subprocess.run([
            "yt-dlp",
            "-x",  # Extract audio
            "--audio-format", "mp3",  # Convert to MP3
            "-o", "./songs/%(title)s.%(ext)s",  # Output directory and filename template
            search_query,
            "--ffmpeg-location", "C:\\Users\\king\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-7.1-essentials_build\\bin\\ffmpeg.exe",  # Full path to ffmpeg
    ], stdout=subprocess.DEVNULL)

    - "yt-dlp -x --audio-format mp3 -o './songs' -o '%(title)s.%(ext)s' -a urls.txt"
    - -x -> download audio only
    - --audio-format mp -> download in mp3 format
    - -o './songs' -> download to the songs folder
    - -o '/%(title)s.%(ext)s' -> specifying the file name: title.format e.g song1.mp3
    - -a urls.txt -> download the list of urls in this file
    - --ffmpeg-location "" -> to explicitly give location of ffmpeg

    - ffmpeg helps to: convert audio to mp3, change audio quality, change audio format, 

# Analysing songs
- Run the function:
    analyse(folder, listOfSongsToDownload, extensions=("mp3"))
- It takes 3 parameters:
    1. folder: the path to the folder containing the downloaded songs
    2. listOfSongsToDownload: a list of dictionaries containig info on the songs to be downloaded. The same list as the one provided to the downloadFromYoutube() function
    3. extensions: extensions allowed
- The analyse() function will run the function analyseSong() on each song in a folder
- The analyseSong() function takes 3 parameters:
    1. file: location of the audio file to be analysed
    2. fileName: the name of the file to be analyses
    3. listOfSongsToDownload: same as one provided provided to the downloadFromYoutube() function
- analyseSong() returns the dictionary: 
    {
        "uri": item["uri"],
        "fileName": filename,
        "bpm": getBpm(),
        "key": getKey(),
        "loudness": getLoudness(),
        "mfcc": getMfcc(),
        "onsets": getOnsets(),
    }
- analyse() returns a list of dictionaries:
    [{
        "uri": item["uri"],
        "fileName": filename,
        "bpm": getBpm(),
        "key": getKey(),
        "loudness": getLoudness(),
        "mfcc": getMfcc(),
        "onsets": getOnsets(),
    }]

# Building the graph
- Building a graph from the analysed charactericts of the songs
- Run the function:
    buildGraph(songs, weights)
- The function takes 2 parameters:
    1. songs: a list of dictionaries e.g
        [{   
            "uri": item["uri"],
            "fileName": filename,
            "bpm": getBpm(),
            "key": getKey(),
            "loudness": getLoudness(),
            "mfcc": getMfcc(),
            "onsets": getOnsets(),
        }]
    2. weights: a list of integers e.g
        [1, 1, 1, 1, 1]

        The weights correspond to song characteristics as follows: bpm, key, loudness
        mfcc and onsets. They determine which characteristic is to be enphasized in the
        comparisons e.g to focus more on bpm it'll be [2,1,1,1,1]
- It calls the function getEdgeweights() to get the weight between songs
- The function returns a graph of the form:
    {songa: {songb, weight}, ...}

# Determining the edge weight #
- The weight of an edge between Song A and Song B represents the transition smoothness. - It's calculated by comparing extracted song characteristics:
    BPM Difference (smaller is better) → Smooth tempo flow.
    Key Compatibility (harmonic similarity) → Avoids jarring transitions.
    Loudness Difference (smaller is better) → Avoids sudden volume jumps.
    Energy/Timbre Similarity (MFCC & Spectral Similarity) → Matches sound texture.
    Onset Alignment (matching rhythmic patterns) → how well beat patterns match

- The weight W(A,B) between song A and B = w1*BPM difference + w2*Key Dissonance + w3*Loudness Difference + w4*Energy dissimilarity + w5*Rhythm Mismatch where w1...5 are weight adjustments based on importance e.g if BPM are more important for the transition, increase w1.
- Run the function:
    getEdgeWeights(songA, songB, weights):
- The function takes 3 parameters:
    1. songA: song dictionary e.g
        {   
            "uri": item["uri"],
            "fileName": filename,
            "bpm": getBpm(),
            "key": getKey(),
            "loudness": getLoudness(),
            "mfcc": getMfcc(),
            "onsets": getOnsets(),
        }
    2. songB: song dictionary of the same form as songA
    3. weights: a list of integers e.g
        [1, 1, 1, 1, 1]

# visualizing the graph
- This is achieved using networkx and matplotlib to visualise the graph.
- Run the function:
    visualizegGaph(graph)

# Finding the smoothest transitioning order of songs
- This is done by using Prim's to fins the Minimum Spanning Tree
- Run the function:
    minimumSpanningTree(graph)
- The function has a parameter of graph of the form {itema: {itemb, weight}, ...}

# Running the functions to obtain an optimized list
1. Declare and initialize the weights list

    weights = [1,1,1,1]

2. Declare and initialize the graph dictionary

    graph = {}

3. Declare and initialize the songs to be downloaded

    data = [{
        "artist": "Tom Odell",
        "songName": "Black Friday",
        "uri": "https://www.youtube.com/watch?v=5Q7J3"
    },{
        "artist": "Wasia Project",
        "songName": "My Vine",
        "uri": "https://www.youtube.com/watch?v=5Q7J3z2Y9Zo"
    }]

4. Run the download fuction. It downloads the songs to a folder called songs at the root of the project structure

    downloadFromYoutube(data)

5. Run the analysis function to get song characterisics. It analyses songs in the songs folder found at the root of the project structure and store the resulting list

    songs = analyse("songs", data, "mp3")

6. Run the build graph function

    graph = buildGraph(songs, weights)

7. Run the MST function

    mst = minimumSpanningTree(graph)

8. (Optional) Visulize the graph

    visualizegGaph(graph)


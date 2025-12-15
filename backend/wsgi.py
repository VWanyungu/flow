from server import app

if __name__ == "__main__":
    app.run()


# waitress-serve --listen=0.0.0.0:5000 --threads=2 wsgi:app
from app import app

#Run the app
if __name__ == "__main__":
    app.run(ssl_context = "adhoc", debug = True)

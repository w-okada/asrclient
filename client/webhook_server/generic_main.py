from http.server import BaseHTTPRequestHandler, HTTPServer
import json

# --- STYLE start ---
bold_green_start = "\033[1;32m"
reset = "\033[0m"
# --- STYLE end ---


class HTTPHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        content_length = int(self.headers["Content-Length"])
        content_data = self.rfile.read(content_length).decode("utf-8")
        data = json.loads(content_data)

        print(data["data"])

        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        response = f"Received POST data: {data['data']}"
        self.wfile.write(response.encode("utf-8"))

    def log_message(self, format, *args):
        return


def run(server_class=HTTPServer, handler_class=HTTPHandler, port=8000):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting httpd server on port {port}...")
    print(f"{bold_green_start}Webhook url is http://localhost:{port} {reset}")
    print(f"{bold_green_start}Please press Ctrl+Cto stop.{reset}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        print(f"{bold_green_start}Shutting down the server...{reset}")
        httpd.server_close()
        print(f"{bold_green_start}Server shut down successfully.{reset}")


if __name__ == "__main__":
    run()

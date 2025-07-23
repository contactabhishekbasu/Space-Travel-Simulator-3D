#!/usr/bin/env python3
"""
Simple HTTP server for Space Travel Simulator 3D
This server is needed to load local texture files due to browser CORS restrictions.
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers to allow texture loading
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom logging
        sys.stderr.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format%args))

def main():
    os.chdir(DIRECTORY)
    
    print(f"🚀 Space Travel Simulator 3D Server")
    print(f"📁 Serving files from: {DIRECTORY}")
    print(f"🌐 Starting server on http://localhost:{PORT}")
    print(f"\n✨ Open your browser and navigate to: http://localhost:{PORT}")
    print(f"📝 Press Ctrl+C to stop the server\n")
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped")
            return

if __name__ == "__main__":
    main()
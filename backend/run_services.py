#!/usr/bin/env python3
"""
Convenience script to run all backend microservices concurrently during development.
Usage:
  python run_services.py
"""
import os
import sys
import subprocess
import time
import signal

SERVICES = [
    ("Gateway", "services.gateway.main:app", "8000"),
    ("Auth Service", "services.auth_service.main:app", "8001"),
    ("Post Service", "services.post_service.main:app", "8002"),
    ("Notification Service", "services.notification_service.main:app", "8003"),
]

def main():
    processes = []
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir

    print("🚀 Starting Social Backend Microservices...")
    print("=" * 60)

    try:
        for name, app_target, port in SERVICES:
            cmd = [
                sys.executable,
                "-m",
                "uvicorn",
                app_target,
                "--host",
                "0.0.0.0",
                "--port",
                port,
                "--reload",
            ]
            print(f"📦 Starting {name:<22} -> http://localhost:{port}")
            p = subprocess.Popen(cmd, cwd=backend_dir, env=env)
            processes.append((name, p))
            time.sleep(0.3)

        print("=" * 60)
        print("✅ All services started! Press Ctrl+C to stop all.")
        
        while True:
            time.sleep(1)
            for name, p in processes:
                if p.poll() is not None:
                    print(f"⚠️ {name} terminated with code {p.returncode}")
    except KeyboardInterrupt:
        print("\n🛑 Stopping all services...")
    finally:
        for name, p in processes:
            p.terminate()
            p.wait()
        print("👋 All services stopped.")

if __name__ == "__main__":
    main()

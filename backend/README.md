# SnapFind — Classification Backend

FastAPI service that classifies photos of lost-and-found items into one of **12 categories**. This is the backend that powers SnapFind's image-based search and automatic item tagging.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/predict/` | Accepts a multipart image (`file`) and returns `{"predicted_class": "<category>"}` |
| `GET` | `/` | Health check |
| `GET` | `/items/{item_id}` | Scaffold echo endpoint |

Interactive API docs are served at [`/docs`](http://127.0.0.1:8000/docs) and [`/redoc`](http://127.0.0.1:8000/redoc) once running.

## Supported categories

`bag`, `charger`, `earbud`, `headphones`, `id`, `key`, `laptop`, `notebook`, `phone`, `shoes`, `umbrella`, `wallet`

## Run locally

```bash
cd backend

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt

# Start from the backend/ directory
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Test it with:

```bash
curl -X POST "http://127.0.0.1:8000/predict/" -F "file=@wallet.jpg"
# {"predicted_class":"wallet"}
```

> On Windows PowerShell, use `curl.exe` instead of `curl` so the `-F` flag reaches curl (not `Invoke-WebRequest`).

## How SnapFind uses it

The React frontend posts item photos to `POST /predict/` and uses the returned category to tag and filter items. By default the frontend targets `http://localhost:8000`; point it at a deployed backend by setting the `VITE_PREDICTION_API_URL` environment variable.

## Model

- **Backbone:** ResNet-18 (transfer learning, ImageNet-pretrained during training)
- **Input:** any Pillow-decodable image, resized to 128×128
- **Output:** 12-way classification
- **Weights:** `model.pth` (loaded at startup, CPU inference)

`modeltester.py` is the training pipeline that produced `model.pth`. It is optional to run the API and expects the original dataset on disk (paths are configured at the top of that script).

## Deploying to Render

A `render.yaml` blueprint is included. Deploy the `backend/` folder directly, or set Render's **Root Directory** to `backend/` when connecting this repository.

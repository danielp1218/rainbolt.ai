import requests
import os
from dotenv import load_dotenv

load_dotenv()  

def get_mapillary_images(lat: float, lon: float, radius: int = 100, limit: int = 5) -> list:

    if not os.getenv("MAPILLARY_API_KEY"):
        raise ValueError("MAPILLARY_API_KEY environment variable not set")
    
    api_key = os.getenv("MAPILLARY_API_KEY")
    url = "https://graph.mapillary.com/images"

    params = {
        "access_token": api_key,
        "fields": "id,thumb_1024_url",
        "bbox": f"{lon-0.003},{lat-0.003},{lon+0.003},{lat+0.003}",
        "limit": limit
    }

    response = requests.get(url, params=params)
    if response.status_code == 200:
        all_data = response.json()
        data = all_data.get('data', [])
        return [img.get('thumb_1024_url') for img in data if img.get('thumb_1024_url')]
    
    else:
        print(f"Error fetching Mapillary images: {response.status_code}")
        return []

print(get_mapillary_images(48.8584, 2.2945))
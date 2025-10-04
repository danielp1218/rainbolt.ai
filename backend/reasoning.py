import os
import getpass
from dotenv import load_dotenv
from typing import Dict
from langchain.chat_models import init_chat_model

os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GRPC_TRACE"] = ""

load_dotenv() 

FEATURE_THRESHOLD = 0.6

if not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter Gemini API Key: ")

def estimate_reasoning(image_matches: Dict, features: Dict) -> str:
    
    model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

    visual_match = ""
    for match in image_matches['matches']:
        latitude = match['metadata']['latitude']
        longitude = match['metadata']['longitude']
        score = match['score']
        visual_match += f"(Latitude: {latitude}, Longitude: {longitude}) - Score: {score}\n"

    features_match = ""
    for match in features['matches']:
        if match['score'] < FEATURE_THRESHOLD:
            continue
        text = match['metadata']['text']
        score = match['score']
        features_match += f"(Description of feature: {text}) - Score: {score}\n"

    prompt = f"""You are a geography expert, expected to find coordinates based on the given information. 

            GIVEN INFORMATION:
            Closest Visual Matches:
            {visual_match}

            Features Detected in Image:
            {features_match}

            Throughout your response, ensure that you convey your though process clearly and in an instructional + educational manner. Do not use stats, and instead give logical reasonings.

            Provide your thought process and reasoning for choosing the coordinates in the following order: (DO NOT DISPLAY STEP BY STEP INSTRUCTIONS)
            1. Identify key features/landmarks from the data provided
            2. Explain their significance and why they point to a specific location
            3. Clearly and concisely state the estimated location/area in one phrase.
            4. Display coordinates at the end.
            5. State estimated accuracy, and justify it.

            Write your response in a digestible format, using bullet points or numbered lists where appropriate. Be concise as possible while ensuring clarity and completeness in your reasoning.
"""

    response = model.invoke(prompt)
    return response.content

def estimate_coordinates(reasoning) -> tuple[float, float]:
    model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

    prompt = f"""
            Give me the top 3 most probable coordinates (latitude, longitude) based on the following reasoning.
                
            CONTEXT: {reasoning}

            Format your response as a JSON array of objects, where each object contains "latitude" and "longitude" keys. Ensure the coordinates are in decimal format.
            """

    response = model.invoke(prompt)

    return response.content

example_image_matches = {'matches': 
    [{'id': '34/4e/10473753674.jpg',
              'metadata': {'latitude': 32.70283, 'longitude': -97.325448},
              'score': 0.836259961,
              'values': []},
             {'id': 'b7/0e/5866325779.jpg',
              'metadata': {'latitude': 43.634646, 'longitude': -88.73537},
              'score': 0.826637,
              'values': []},
             {'id': '2f/da/9546970320.jpg',
              'metadata': {'latitude': 49.531844, 'longitude': 18.800769},
              'score': 0.82104528,
              'values': []}],
 'namespace': 'images',
 'usage': {'read_units': 1}}

example_features = {'matches': [{'id': 'page_115_p0-15.png',
              'metadata': {'id': 'page_115_p0-15.png',
                           'text': '115   Canada   -   .ca       Canadian   '
                                   'bollards   often   feature   a   white   '
                                   'post   with   different   design   and   '
                                   'reflectors   depending   on   the   '
                                   'region.     Key   Features:   Due   to   '
                                   'Canada   having   many   variants   of   '
                                   'bollards,   I   recommend   learning   '
                                   'them   and   their   regions   on   the   '
                                   'Plonk   It   Guide ,   as   they   '
                                   'explain   where   each   bollard   can   '
                                   'be   found.   Each   of   those   '
                                   'bollards   are   region-specific   and   '
                                   'pretty   common,   which   makes   them   '
                                   'overall   a   great   clue   worth   '
                                   'learning.   '},
              'score': 0.926163673,
              'values': []},
             {'id': 'page_42_p0-6.png',
              'metadata': {'id': 'page_42_p0-6.png',
                           'text': '42   Slovenia   -   .si       Slovenian   '
                                   'bollards   feature   a   white   post   '
                                   'with   a   rectangular   red   reflector   '
                                   'on   the   front   and   a   white   one   '
                                   'on   the   back.   The   bollard   also   '
                                   'has   a   black   top.       Key   '
                                   'Features:   These   bollards   are   not   '
                                   'unique   to   Slovenia.   It   has   '
                                   'identical   ones   that   are   also   '
                                   'found   in   Montenegro.   Slovenia   '
                                   'also   uses   the   same   bollards   as   '
                                   'Austria.   However,   the   reflector   '
                                   'on   the   Slovenian   bollard   is   '
                                   'always   red   and   never   black   and   '
                                   'will   also   not   feature   the   cap   '
                                   'on   top.   Another   similar   one   is   '
                                   'found   in   Russia,   but   the   '
                                   'reflectors   in   Russia   are   '
                                   'connected   to   the   back   '
                                   'top.         '},
              'score': 0.923458219,
              'values': []},
             {'id': 'page_37_p0-7.png',
              'metadata': {'id': 'page_37_p0-7.png',
                           'text': '37   Romania   -   .ro       Romanian   '
                                   'bollards   feature   a   curved   white   '
                                   'post   with   a   red   rectangular   '
                                   'reflector   on   the   front   and   a   '
                                   'faint   white   reflector   on   the   '
                                   'back.     Key   Features:   Bollards   '
                                   'are   not   very   common   in   '
                                   'Romania.   This   bollard   is   very   '
                                   'similar   to   the   ones   found   in   '
                                   'Turkey.   There   are   slight   '
                                   'differences;   Turkey   appears   to   '
                                   'be   thinner,   but   it   is   better   '
                                   'to   look   for   other   clues.   '
                                   'Turkey   also   has   no   reflector   '
                                   'on   the   back   while   Romania   has   '
                                   'a   faint   white   reflector   on   the   '
                                   'back.   It   is   also   similar   to   '
                                   'the   Netherlands,   but   the   '
                                   'Netherlands   has   a   more   rounded   '
                                   'edge   and   a   smoother   design.   '
                                   'Other   bollards   share   a   similar   '
                                   'design   to   this   one   like   rare   '
                                   'ones   in   Croatia   or   Albania.   '
                                   'Those   similar   ones   are   rarer   '
                                   'in   their   respective   countries   '
                                   'and   not   their   main   bollard.   It   '
                                   'is   much   more   common   to   see   '
                                   'these   unique   Milestones   markers,   '
                                   'which   are   the   larger   markers   '
                                   'that   are   found   on   nearly   every   '
                                   'road,   which   point   with   a   '
                                   'distance   in   KM   on   it   to   '
                                   'large   cities   along   with   the   '
                                   'road   number   on   the   side   (there   '
                                   'is   also   a   blue   variant   found   '
                                   'on   a   country   road,   592).   Other   '
                                   'notable   milestones   with   similar   '
                                   'designs   to   this   one   are   found   '
                                   'in   France/RÃ©union,   Cambodia,   '
                                   'Tunisia,   and   Senegal.   However,   '
                                   'Romania   is   distinct   with   its   '
                                   'unique   base   and   overall   '
                                   'design.       '},
              'score': 0.910467625,
              'values': []}],
 'namespace': 'features',
 'usage': {'read_units': 1}}

print(estimate_reasoning(example_image_matches, example_features))
print(estimate_coordinates(estimate_reasoning(example_image_matches, example_features)))
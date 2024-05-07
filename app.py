from flask import Flask, render_template, request, jsonify
import pandas as pd
import warnings
import json

warnings.filterwarnings("ignore")

numerical_columns = [
    'Literarcy rate', 'Disease_deaths', 'Road traffic death rate',
    'Suicide rate', 'Deaths', 'GDP', 'Population',
    'Population of children under the age of 1',
    'Population of children under the age of 5',
    'Population of children under the age of 15',
    'Population under the age of 25'
]

app = Flask(__name__)

df = pd.read_csv("final_comb_data.csv")

with open('merged_world_map.geojson', 'r') as file:
    geojson_data = json.load(file)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/references')
def ref():
    return render_template('references.html')

@app.route('/get_geojson_data', methods=['POST'])
def get_geojson_data():
    print("HII")
    return jsonify(geojson_data)

@app.route('/get_data', methods=['POST'])
def get_data():

    return jsonify(df.to_dict(orient='records'))

@app.route('/get_income_data', methods=['POST'])
def get_income_data():
    low_threshold = int(request.form.get('low_threshold'))
    mid_threshold = int(request.form.get('mid_threshold'))
    year = int(request.form.get('year'))

    year_data = df[df['Year'] == year]

    low_income_countries = year_data[year_data['GDP'] < low_threshold]
    mid_income_countries = year_data[(year_data['GDP'] >= low_threshold)
                                     & (year_data['GDP'] < mid_threshold)]
    high_income_countries = year_data[year_data['GDP'] >= mid_threshold]

    low_income_avg = low_income_countries.mean().to_dict()
    mid_income_avg = mid_income_countries.mean().to_dict()
    high_income_avg = high_income_countries.mean().to_dict()

    data = {
        'low_income_avg': low_income_avg,
        'mid_income_avg': mid_income_avg,
        'high_income_avg': high_income_avg
    }

    return jsonify(data)


@app.route('/get_country_names', methods=['POST'])
def get_country_names():

    data = {
        'country_names': df["Country"].unique().tolist(),
    }

    return jsonify(data)

@app.route('/choose_country', methods=['POST'])
def choose_country():
    country_df = df[df['Country'] == 'Albania']
    return jsonify(country_df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)

# Clean code # wink wink

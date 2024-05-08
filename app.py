from flask import Flask, render_template, request, jsonify
import pandas as pd
import warnings
import json
from sklearn.preprocessing import StandardScaler, PowerTransformer
from sklearn.manifold import MDS
from sklearn.cluster import KMeans
import numpy as np
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

num_df = df[numerical_columns]
X = num_df.values.tolist()

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



@app.route('/MDS_corr', methods=['POST'])
def MDS_corr():

    print("\n\n In PCA BIPLOT")
    scaler = StandardScaler()
    power_transformer = PowerTransformer(method='yeo-johnson')

    X_s = scaler.fit_transform(X)
    X_s = power_transformer.fit_transform(X_s)

    correlation_matrix = np.corrcoef(X_s.T)
    correlation_distances = 1 - np.abs(correlation_matrix)
    variables_mds = MDS(n_components=2, dissimilarity='precomputed',random_state=69)
    variables_mds_transformed = variables_mds.fit_transform(
        correlation_distances)


    data = {
        'MDS_var_vectors':variables_mds_transformed.tolist(),
        'feature_names': numerical_columns,
        'MDS_correlation_matrix': correlation_matrix.tolist()
    }

    return jsonify(data)



if __name__ == '__main__':
    app.run(debug=True)

# Clean code # wink wink

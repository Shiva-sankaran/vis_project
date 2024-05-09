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
    'Literarcy rate', 'Road traffic death rate',
    'Suicide rate', 'Deaths', 'GDP', 'Population',
    'Schizophrenia (%)', 
    'Bipolar disorder (%)', 'Eating disorders (%)', 
    'Anxiety disorders (%)', 'Drug use disorders (%)', 
    'Depression (%)', 'Alcohol use disorders (%)'
]

app = Flask(__name__)

df = pd.read_csv("socio-eco-inter-data.csv")

num_df = df[numerical_columns]
X = num_df.values.tolist()

with open('socio-eco-inter-data.geojson', 'r') as file:
    geojson_data = json.load(file)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/references')
def ref():
    return render_template('references.html')

@app.route('/team')
def team():
    return render_template('team.html')



@app.route('/get_geojson_data', methods=['POST'])
def get_geojson_data():
    print("HII")

    # year = 2020  # Change this to the desired year
    year = int(request.form.get('year'))

    filtered_features = []
    for feature in geojson_data['features']:
        new_feature = feature.copy()
        properties = new_feature['properties']
        new_properties = properties.copy()
        if (str(year) not in new_properties['data']):
            new_properties['data'][str(year)] = dict.fromkeys(
                new_properties['data'][list(new_properties['data'].keys())[0]],
                0)

        new_properties.update(new_properties['data'][str(year)])
        del new_properties['data']
        new_feature['properties'] = new_properties
        filtered_features.append(new_feature)

    filtered_geojson_data = {
        'type': 'FeatureCollection',
        'features': filtered_features
    }
    return jsonify(filtered_geojson_data)
    # return jsonify(geojson_data)


@app.route('/get_data', methods=['POST'])
def get_data():

    return jsonify(df.to_dict(orient='records'))


@app.route('/get_income_data', methods=['POST'])
def get_income_data():
    print("IN INCOME DATA")
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
    print("RETURING data:", data)
    return jsonify(data)


@app.route('/get_country_names', methods=['POST'])
def get_country_names():

    data = {
        'country_names': df["Country"].unique().tolist(),
    }

    return jsonify(data)


@app.route('/choose_country', methods=['POST'])
def choose_country():
    # country_name = request.form.get('country')
    print(request.form.get('country'))
    country_df = df[df['Country'] == request.form.get('country')]
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
    variables_mds = MDS(n_components=2,
                        dissimilarity='precomputed',
                        random_state=69)
    variables_mds_transformed = variables_mds.fit_transform(
        correlation_distances)

    data = {
        'MDS_var_vectors': variables_mds_transformed.tolist(),
        'feature_names': numerical_columns,
        'MDS_correlation_matrix': correlation_matrix.tolist()
    }

    return jsonify(data)


@app.route('/stacked_barcharts', methods=['POST'])
def stacked_barcharts():

    mental_cols = [
        "Year", 'Alcohol use disorders (%)', 'Bipolar disorder (%)',
        'Eating disorders (%)', 'Depression (%)', 'Drug use disorders (%)'
    ]
    print(request.form.get('country'))
    country_df = df[df['Country'] == request.form.get('country')]
    selected_df = country_df[mental_cols]
    data_list = selected_df.to_dict(orient='records')
    final_data = []
    for item in data_list:
        final_data.append({
            'year': item["Year"],
            "diseases": {
                'Alcohol use disorders (%)': item["Alcohol use disorders (%)"],
                'Bipolar disorder (%)': item['Bipolar disorder (%)'],
                'Eating disorders (%)': item['Eating disorders (%)'],
                'Depression (%)': item['Depression (%)'],
                'Drug use disorders (%)': item['Drug use disorders (%)']
            }
        })

    return jsonify(final_data)


if __name__ == '__main__':
    app.run(debug=True)

# Clean code # wink wink

# Fix missing data in geospatial (Might have to use data filling methods or create data) [DONE]
# Also fix legend and coloring for different attribute values (somethign like top 10% percentile) {NOT DOING DONE}
# Remove country selection dropdown [DONE]
# Font sizes
# Make everything more viewable

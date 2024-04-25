from flask import Flask, render_template, request, jsonify
from sklearn.decomposition import PCA
from sklearn import datasets
import numpy as np

from sklearn.cluster import KMeans
from sklearn.metrics import mean_squared_error
from kneed import KneeLocator
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import StandardScaler, PowerTransformer
import pandas as pd
import warnings

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

df = pd.read_csv("data.csv")
df = df[numerical_columns]
X = df.values.tolist()

num_clusters = -1
intrinsic_dim = -1


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/references')
def ref():
    return render_template('references.html')


@app.route('/pca', methods=['POST'])
def pca():
    num_components = len(numerical_columns)

    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)

    power_transformer = PowerTransformer(method='yeo-johnson')
    X_s = power_transformer.fit_transform(X_s)

    pca = PCA(n_components=num_components)
    X_pca = pca.fit_transform(X_s)

    explained_variance_ratio = pca.explained_variance_ratio_

    eigenvalues = pca.explained_variance_

    cum_explained_variance = np.cumsum(explained_variance_ratio)

    data = {
        'X_pca': X_pca.tolist(),
        'explained_variance_ratio': explained_variance_ratio.tolist(),
        'eigenvalues': eigenvalues.tolist(),
        'cum_explained_variance': cum_explained_variance.tolist()
    }

    return jsonify(data)


@app.route('/set_num_clusters', methods=['POST'])
def set_num_clusters():
    global num_clusters
    num_clusters = int(request.json['num_clusters'])
    print("\n\nSet num_clusters to: ", num_clusters)
    return jsonify(
        {'message': f'num_clusters dimension set to {num_clusters}'}), 200


intrinsic_dim = -1


@app.route('/set_intrinsic_dim', methods=['POST'])
def set_intrinsic_dim():
    global intrinsic_dim
    intrinsic_dim = int(request.json['intrinsic_dim'])
    print("\n\nSet intrinsic dim to: ", intrinsic_dim)
    return jsonify({'message':
                    f'Intrinsic dimension set to {intrinsic_dim}'}), 200


@app.route('/kmeans_mse', methods=['POST'])
def kmeans_mse():

    k = int(request.form['num_clusters'])
    mse_values = []
    for i in range(1, k + 1):
        kmeans = KMeans(n_clusters=i, random_state=42)
        kmeans.fit(X)
        centroids = kmeans.cluster_centers_
        labels = kmeans.labels_
        mse = mean_squared_error(X, centroids[labels])
        mse_values.append(mse)

    return jsonify(mse_values=mse_values)


@app.route('/find_knee', methods=['POST'])
def retElbowPoint():
    data = request.form['data']
    print(data)
    data = list(map(float, data.strip('][').split(",")))
    x = range(1, len(data) + 1)
    y = data

    knee = KneeLocator(x, y, S=1.0, curve='convex', direction='decreasing')
    knee_point = knee.knee

    data = {
        'knee_point': int(knee_point),
    }
    return jsonify(data)


@app.route('/pca_biplot', methods=['POST'])
def pca_biplot():
    global num_clusters, intrinsic_dim
    print("\n\n In PCA BIPLOT")
    print("Int dim:", intrinsic_dim)
    print("num clusters: ", num_clusters)
    num_components = len(numerical_columns)
    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)

    power_transformer = PowerTransformer(method='yeo-johnson')
    X_s = power_transformer.fit_transform(X_s)

    pca = PCA(n_components=num_components)
    X_pca = pca.fit_transform(X_s)

    components = pca.components_.T

    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(X_pca)
    cluster_labels = kmeans.labels_

    data = {
        'X_pca': X_pca.tolist(),
        'pca_components': components.tolist(),
        'cluster_labels': cluster_labels.tolist(),
        'feature_names': numerical_columns
    }

    return jsonify(data)


@app.route('/pca_top', methods=['POST'])
def pca_top():
    global num_clusters, intrinsic_dim

    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)

    power_transformer = PowerTransformer(method='yeo-johnson')
    X_s = power_transformer.fit_transform(X_s)

    pca = PCA(n_components=intrinsic_dim)
    X_pca = pca.fit_transform(X_s)
    components = pca.components_.T
    selected_components = components[:, :intrinsic_dim]
    loading_scores = np.sqrt(np.sum(selected_components**2, axis=1))
    sorted_indices = np.argsort(loading_scores)[::-1]
    sorted_loading_scores = np.sort(loading_scores)[::-1]
    sorted_loading_scores = np.round(sorted_loading_scores, decimals=3)
    most_important_columns = [numerical_columns[i] for i in sorted_indices]

    data = {
        'most_important_columns': most_important_columns[:4],
        'loading_scores': sorted_loading_scores.tolist()[:4],
    }

    return jsonify(data)


@app.route('/scatter_matrix', methods=['POST'])
def generate_scatter_matrix():
    global num_clusters, intrinsic_dim

    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)

    power_transformer = PowerTransformer(method='yeo-johnson')
    X_s = power_transformer.fit_transform(X_s)

    pca = PCA(n_components=intrinsic_dim)
    X_pca = pca.fit_transform(X_s)
    components = pca.components_.T
    selected_components = components[:, :intrinsic_dim]
    loading_scores = np.sqrt(np.sum(selected_components**2, axis=1))
    sorted_indices = np.argsort(loading_scores)[::-1]
    most_important_columns = [numerical_columns[i] for i in sorted_indices[:4]]

    df = pd.DataFrame(X, columns=numerical_columns)
    df = df[most_important_columns]

    kmeans_models = {}
    for i, xColumn in enumerate(df.columns):
        for j, yColumn in enumerate(df.columns):
            if i != j:
                combined_data = df[[xColumn, yColumn]]
                kmeans = KMeans(n_clusters=num_clusters, random_state=42)
                kmeans.fit(combined_data)
                kmeans_models[(xColumn, yColumn)] = kmeans

    cluster_labels = {}
    for (xColumn, yColumn), kmeans in kmeans_models.items():
        combined_data = df[[xColumn, yColumn]]
        cluster_labels[(xColumn,
                        yColumn)] = kmeans.predict(combined_data).tolist()

    scatter_data = df.to_dict(orient='records')

    cluster_labels_str = {
        str(key): value
        for key, value in cluster_labels.items()
    }

    data = {'scatter_data': scatter_data, 'cluster_labels': cluster_labels_str}

    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True)

# Clean code # wink wink

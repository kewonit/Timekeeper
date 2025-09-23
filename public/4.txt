#include <iostream>
#include <vector>
#include <climits>
using namespace std;

/*
Dijkstra's Algorithm (Simple version)
- Finds the shortest path from a single source to all nodes
- This version does NOT use priority_queue (easier to read)
- Time Complexity: O(n^2)
*/

void dijkstra(int numNodes, int source, vector<vector<pair<int,int>>> &graph) {
    // Step 1: Distance array
    vector<int> distance(numNodes, INT_MAX);
    distance[source] = 0;

    // Step 2: Visited array (to mark processed nodes)
    vector<bool> visited(numNodes, false);

    // Step 3: Repeat for all nodes
    for(int i = 0; i < numNodes; i++) {
        // Find the unvisited node with the smallest distance
        int currentNode = -1;
        int minDist = INT_MAX;
        for(int j = 0; j < numNodes; j++) {
            if(!visited[j] && distance[j] < minDist) {
                minDist = distance[j];
                currentNode = j;
            }
        }

        if(currentNode == -1) break; // no reachable nodes left
        visited[currentNode] = true;

        // Step 4: Update neighbors
        for(auto edge : graph[currentNode]) {
            int neighbor = edge.first;
            int weight = edge.second;

            if(distance[currentNode] + weight < distance[neighbor]) {
                distance[neighbor] = distance[currentNode] + weight;
            }
        }
    }

    // Step 5: Print results
    cout << "Shortest distances from node " << source << ":\n";
    for(int i = 0; i < numNodes; i++) {
        cout << "Node " << i << " : ";
        if(distance[i] == INT_MAX) cout << "Unreachable";
        else cout << distance[i];
        cout << "\n";
    }
}

int main() {
    int numNodes = 5; // We have 5 nodes (0,1,2,3,4)

    // Graph stored as adjacency list
    vector<vector<pair<int,int>>> graph(numNodes);

    // Add edges (directed)
    graph[0].push_back({1, 2});
    graph[0].push_back({2, 4});
    graph[1].push_back({2, 1});
    graph[1].push_back({3, 7});
    graph[2].push_back({4, 3});
    graph[3].push_back({4, 1});

    // Run Dijkstra from node 0
    dijkstra(numNodes, 0, graph);

    return 0;
}

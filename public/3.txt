#include <iostream>
#include <vector>
using namespace std;

/*
0/1 Knapsack Problem using Dynamic Programming
- n items, each with weight[i] and value[i]
- Bag capacity = W
*/

int knapsack(int n, int W, vector<int> &weight, vector<int> &value) {
    // DP table: dp[i][w] = max value using first i items with capacity w
    vector<vector<int>> dp(n+1, vector<int>(W+1, 0));

    // Fill the table
    for(int i = 1; i <= n; i++) {
        for(int w = 1; w <= W; w++) {
            if(weight[i-1] <= w) {
                // Choice: take or skip item i-1
                dp[i][w] = max(
                    value[i-1] + dp[i-1][w - weight[i-1]], // take it
                    dp[i-1][w]                             // skip it
                );
            } else {
                // Can't take this item (too heavy)
                dp[i][w] = dp[i-1][w];
            }
        }
    }

    return dp[n][W]; // answer is max value with n items and capacity W
}

int main() {
    int n = 4; // number of items
    int W = 5; // knapsack capacity

    // item weights
    vector<int> weight = {2, 1, 3, 2};
    // item values
    vector<int> value  = {12, 10, 20, 15};

    cout << "Maximum value in Knapsack = " << knapsack(n, W, weight, value) << endl;

    return 0;
}

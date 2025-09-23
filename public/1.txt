#include <vector>
#include <iostream>
using namespace std;


class Solution {
public:
    vector<int> quickSort(vector<int>& nums) {
        int n=nums.size();
        if (n == 0) { 
            return nums;
        }
        qs(nums, 0 , n-1);
        return nums;
    }

    void qs(vector<int>& arr ,int low ,int high){
        if(low<high){
            int pIndex = partition(arr , low , high);
            qs(arr , low , pIndex-1);
            qs(arr , pIndex+1, high);
        }
    }

    int partition(vector<int>& arr,int low ,int high){
        int pivot = arr[low];
        int i = low;
        int j = high;

        while(i<j){

            while(arr[i]<=pivot && i<= high){
            i++;
            }
            while(arr[j]>pivot && j>=low){
                j--;
            }
            if(i<j){
                swap(arr[i],arr[j]);
            }
        }

        swap(arr[low],arr[j]);
        return j;

   }



};

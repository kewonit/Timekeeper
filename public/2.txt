#include<iostream>
#include<vector>
using namespace std;




void merge(int arr[] , int low , int mid, int high){
   int left = low;
   int right = mid+1;


   int temp[high-low+2];
   int i=0;
   while(left<=mid && right<=high){
       if(arr[left]<arr[right]){


           temp[i] = arr[left];
           left++;
       }else{
           temp[i] = arr[right];
           right++;
       }
       i++;
   }
   while(left<=mid){
       temp[i] = arr[left];
       left++;
       i++;
   }
   while(right<=high){
       temp[i] = arr[right];
       right++;
       i++;
   }


   for(int j=low;j<=high;j++){
       arr[j] = temp[j-low];
   }
}




void mergeSort(int arr[] , int low , int high ){


   if(low >= high){
       return;
   }
   int mid = (low + high)/2;
   mergeSort(arr , low , mid);
   mergeSort(arr , mid+1 , high );
   merge(arr , low , mid ,high );
}




int main(){
   int n=0;
      
   cout<<"enter string length"<<endl;
   cin>>n;
  
   cout<<"enter "<<n<<" numbers"<<endl;
   int arr[n];
   int temp;
   for(int i=0;i<n;i++){
       cin>> temp;
       arr[i] = temp;
   }
   mergeSort(arr,0 , n - 1);


   cout<<"\nsorted elements"<<endl;


   for(int i=0;i<n;i++){
       cout<<arr[i]<< ' ';
   }
   cout<<"\n";
  


}


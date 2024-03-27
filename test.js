function maximumSubarraySumSizeK(N, A, K) {
  let sum = 0,
    maxSum = 0;
  let left = 0,
    right = 0; // Initialize Pointer
  // loop and condition to satisfy
  while (right < N) {
    sum += A[right];
    //Condition to be satisfy for window
    if (right - left + 1 === K) {
      //condition to update maxsum
      if (maxSum < sum) {
        maxSum = sum;
      }
      //remove left element
      left++;
    }
    //increase window size
    right++;
  }
  return maxSum;
}

let arr = [1, 6, 2, 4, 9, 8];
console.log(maximumSubarraySumSizeK(6, arr, 2));
console.log(eval(1 + 6 + 2 + 4 + 9 + 8));

/** lightsout.c : 5 x 5 type **/
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#define N 25 // Number of rows in the matrix
void genmat(void);
int solvable(int *num, int n);
int *solve(int *num, int n);
int a[N][N+1];
int main(void) {
  char buf[BUFSIZ], *pos;
  int i = 0, light[N], *ans;
  // Input for the positions of the lights
  printf("Lit positions: "); scanf("%[^\n]", buf);
  pos = strtok(buf, " ");
  while (pos != NULL) {
    light[i++] = atoi(pos);
    pos = strtok(NULL, " ");
  }
  // Check if the puzzle is solvable
  if (solvable(light, i) == 1) puts("Solvable!");
  else puts("Unsolvable!");
  // Display the solution array
  ans = solve(light, i);
  if (ans[0] != -1) {
    printf("Solution: ");
    for (i = 0 ; i < N; i++) printf("%d ", ans[i]);
    printf("\n");
  }
  free(ans);
  return 0;
}
/* Generate the matrix for Lights Out */
void genmat(void) {
  int i, j;
  for (i = 0; i < N; i++) {
    for (j = 0; j < N; j++) {
      if (j == i||((i-1)%5 != 4&&j == i-1)||((i+1)%5 != 0&&j == i+1)||j == i-5||j == i+5) a[i][j] = 1;
      else a[i][j] = 0;
    }
    a[i][N] = 0;
  }
}
/* Determine solvability from the array of light positions */
int solvable(int *num, int n) {
  int k, i, j, p, tmp;
  genmat(); // Initialize the matrix
  for (i = 0; i < n; i++) a[num[i]][N] = 1; // Set light positions in the last column of the matrix
  for (k = 0; k < N - 1; k++) {
    // Find the pivot
    for (p = k; p < N; p++) if (a[p][k] == 1) break;
    if (p == N) p = k;
    // Swap rows
    if (p != k) {
      for (i = k; i <= N; i++) {
        tmp = a[k][i];
        a[k][i] = a[p][i];
        a[p][i] = tmp;
      }
    }
    // Perform forward elimination to transform elements from a[k+1][k] through a[N-1][k] into 0
    for (i = k + 1; i <= N - 1; i++) {
      if (a[i][k] == 1) {
        for (j = k + 1; j <= N; j++) {
          tmp = a[i][j] + a[k][j];
          if (tmp == 2) a[i][j] = 0;
          else a[i][j] = tmp;
        }
      }
    }
  }
  // Check if the puzzle is solvable (in 5x5 case, a[24][25]=a[23][25]=0 means solvable)
  if (a[24][25] == 0 && a[23][25] == 0) return 1;
  else return 0;
}
/* Generate the solution from the light positions */
int *solve(int *num, int n) {
  int i, j, tmp, *ans;
  ans = (int *)malloc(sizeof(int) * N);
  srand((unsigned int)time(NULL));
  if (a[0][0] == 0) solvable(num, n); // Execute 'solvable' if it hasn't been executed
  if (a[24][25] != 0 || a[23][25] != 0) ans[0] = -1; // Set ans[0] to -1 if unsolvable
  else {
    // Set the values of a[24][25] and a[23][25] to 0 or 1 randomly
    ans[24] = rand() % 2;
    ans[23] = rand() % 2;
    // Back substitution: sequentially determine the values of a[22][25] to a[0][25]
    for (i = 22; i >= 0; i--) {
      tmp = 0;
      for (j = i + 1; j < N; j++) {
        tmp = tmp + a[i][j] * ans[j];
      }
      tmp = a[i][N] - tmp;
      if (tmp < 0) tmp = tmp * (-1);
      ans[i] = tmp % 2;
    }
  }
  return ans;
}

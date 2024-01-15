/* lightsout.c : 5 x 5 type */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#define N 25 // 行列の行数
void genmat(void);
int solvable(int *num, int n);
int *solve(int *num, int n);
int a[N][N+1];
int main(void) {
  char buf[BUFSIZ], *pos;
  int i = 0, light[N], *ans;
  /* 点灯位置の入力 */
  printf("点灯位置: "); scanf("%[^\n]", buf);
  pos = strtok(buf, " ");
  while (pos != NULL) {
    light[i++] = atoi(pos);
    pos = strtok(NULL, " ");
  }
  /* 可解かどうか判定 */
  if (solvable(light, i) == 1) puts("Solvable!");
  else puts("Unsolvable!");
  /* 解の配列を表示 */
  ans = solve(light, i);
  if (ans[0] != -1) {
    printf("Solution: ");
    for (i = 0 ; i < N; i++) printf("%d ", ans[i]);
    printf("\n");
  }
  free(ans);
  return 0;
}
/* ライツアウトの行列の生成 */
void genmat(void) {
  int i, j;
  for (i = 0; i < N; i++) {
    for (j = 0; j < N; j++) {
      if (j == i||((i-1)%5 != 4&&j == i-1)||((i+1)%5 != 0&&j == i+1)||j == i-5||j == i+5) a[i][j] = 1;
      else a[i][j] = 0;
    }
  }
}
/* 点灯位置の配列numから可解性を判定 */
int solvable(int *num, int n) {
  int k, i, j, p, tmp;
  genmat(); // 行列の初期化
  for (i = 0; i < n; i++) a[num[i]][N] = 1; // 行列の第N列に点灯位置を入力
  for (k = 0; k < N - 1; k++) {
    /* ピボットを取得 */
    for (p = k; p < N; p++) {
      if (a[p][k] == 1) break;
    }
    if (p == N) p = k;
    /* 行の入れ替え */
    if (p != k) {
      for (i = k; i <= N; i++) {
        tmp = a[k][i];
        a[k][i] = a[p][i];
        a[p][i] = tmp;
      }
    }
    /* 前進消去：a[k+1][k]～a[N-1][k]を0にする変形 */
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
  /* 可解性判定(5x5の場合はa[24][25]=a[23][25]=0なら可解) */
  if (a[24][25] == 0 && a[23][25] == 0) return 1;
  else return 0;
}
/* 点灯位置から解を生成 */
int *solve(int *num, int n) {
  int i, j, tmp, *ans;
  ans = (int *)malloc(sizeof(int) * N);
  srand((unsigned int)time(NULL));
  if (a[0][0] == 0) solvable(num, n); // solvableが未実行の場合は実行
  if (a[24][25] != 0 || a[23][25] != 0) ans[0] = -1; // 非可解の場合はans[0]=-1に
  else {
    /* a[24][25]～a[23][25]の値(0 or 1)をランダムに設定 */
    a[24][25] = rand() % 2;
    a[23][25] = rand() % 2;
    /* 後退代入：a[22][25]～a[0][25]の値を順に求める */
    for (i = 22; i >= 0; i--) {
      tmp = 0;
      for (j = i + 1; j < N; j++) {
        tmp = tmp + a[i][j] * a[j][N];
      }
      tmp = a[i][N] - tmp;
      if (tmp < 0) tmp = tmp * (-1);
      a[i][N] = tmp % 2;
    }
    /* 解の配列を生成 */
    for (i = 0 ; i < N; i++) {
      ans[i] = a[i][N];
    }
  }
  return ans;
}

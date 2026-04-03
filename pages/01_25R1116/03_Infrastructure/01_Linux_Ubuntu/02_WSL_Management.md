# 02. WSLの管理とバックアップ

授業で触れられている `wsl` 関連のコマンド群は、Windows上でLinux環境（仮想マシン）を管理するための管理者用コマンドです。（Linuxの中ではなく、WindowsのPowerShell等で打ち込みます）

## 1. 状態の確認と停止

### `wsl -l -v` (list / verbose)

現在インストールされているLinuxディストリビューション（Ubuntuなど）の一覧と、現在の稼働状態（Running / Stopped）、WSLのバージョン（通常は WSL 2 です）を確認します。

### `wsl --shutdown` / `wsl --terminate マシン名`

WSLは、ウィンドウズを閉じても裏（バックグラウンド）で動き続けてメモリを消費します。
- `--shutdown`: すべてのWSLの仮想マシンを完全に終了（電源オフ）させ、メモリを解放します。
- `--terminate Ubuntu`: 特定のマシン（この場合は"Ubuntu"）だけを狙って強制終了します。

## 2. 実務最大の武器：スナップショット（バックアップ機能）

仮想環境（WSLやDocker、VMWareなど）が物理PCよりも優れている最大の点は、**システム全体の「セーブデータ」をファイルとして簡単に出し入れできる**点です。

授業でLAMP環境など複雑な設定をする前や、設定をミスしてLinuxが壊れてしまった時のために使います。

### エクスポート (バックアップの作成)

現在のLinuxの状態を丸ごとひとつの `.tar` ファイル（書庫ファイル）として固めて保存します。

```powershell
wsl --export Ubuntu C:\Backup\ubuntu_backup.tar
```

### アンレジスター (仮想マシンの削除・初期化)

壊れたマシンや、不要になったマシンを登録解除（＝削除）します。中のデータは完全に消えます。

```powershell
wsl --unregister Ubuntu
```

### インポート (バックアップからの復元)

エクスポートした `.tar` ファイルを指定して、全く同じ状態のLinuxを蘇らせます。

```powershell
# 書式: wsl --import <つけたい名前> <仮想ディスクを置く場所> <tarファイルのパス>
wsl --import Ubuntu-Restore C:\WSL\UbuntuRestore C:\Backup\ubuntu_backup.tar
```

※実務でも、新人エンジニア向けに「あらかじめ色々設定済みのWSL用tarファイル」を社内で配布して、それをインポートさせるだけで開発環境が完成する、という手法が取られることがあります。

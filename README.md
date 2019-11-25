# NotifyNaroUpdated

## はじめに

このプログラムは [小説家になろう](https://syosetu.com/) で連載中の作品が更新された場合に、LINEに通知メッセージを送信します。

このプログラムを動かすには、GoogleアカウントとLINEアカウントが必要です。

導入にはTypeScriptのビルド環境(clasp)も必要です。

## 導入手順

### LINE チャネルの作成

1. [LINE Business ID](https://account.line.biz/login) サイトへログインし、通知用チャネルを作成する。
1. 自動応答メッセージを `利用しない` に変更する。
1. `アクセストークン（ロングターム）` をメモする。
1. 作成したチャネルを友達に追加する。

### G Suite Developer Hub プロジェクトの作成

1. [G Suite Developer Hub](https://script.google.com/) へログインし、新しいプロジェクトを作成する。
1. [src](https://github.com/draqoon/NotifyNaroUpdated/tree/master/src) 以下を `clasp push` する。

### 初期設定を行なう

1. WEB のエディタ画面から `Seteup.gs`を開き、`initialize` 関数を実行する。
    - 監視リストを保存する Google Spreadsheet ファイルが `小説家になろう更新通知リスト` という名前で作成される。
      作成後はファイル名の変更やフォルダの移動等を行なうことができる。

1. スクリプトのプロパティに以下を設定する。

    | プロパティ名             | 設定する値 |
    |---                       |---|
    |LINE_CHANNEL_ACCESS_TOKEN |作成した LINE チャネルのアクセストークン（ロングターム）|

1. ウェブアプリケーションとして公開し、URLをメモしておく。

1. [LINE Business ID](https://account.line.biz/login) サイトへログインし、Webhook送信を `利用する` に変更、Webhook URL に URL を設定する。

### 定期的に監視するトリガーを作成

1. 実行する関数に `main` を、イベントのソースを `時間主導型` に設定する。実行間隔は適当に設定する。

## 監視する作品の追加

1. チャネルに対してコマンドとなるテキストメッセージを発信することで監視する作品の管理を行うことができる。

    |コマンド|説明|
    |--------|----|
    |add (URL or Nコード)| 該当のURLの作品を監視対象へ追加する。 |
    |del| 監視中の作品のリストをカルーセルメッセージとして返信し、`監視停止` リンククリックで監視対象から削除する。|
    |del (URL or Nコード)| 該当のURLの作品を監視対象から削除する。 |
    |list| 監視中の作品のリストを返信する。 |
    |help| コマンドの説明を返信する。 |

1. Google Spreadsheet ファイルを直接編集することで監視対象を追加・削除することもできる。

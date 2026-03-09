import json
import sys

from googlenewsdecoder import gnewsdecoder


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": False, "message": "Missing URL"}))
        return

    url = sys.argv[1]

    try:
        result = gnewsdecoder(url, interval=1)

        if result.get("status"):
            print(json.dumps({
                "status": True,
                "decoded_url": result.get("decoded_url")
            }))
        else:
            print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "status": False,
            "message": str(e)
        }))


if __name__ == "__main__":
    main()
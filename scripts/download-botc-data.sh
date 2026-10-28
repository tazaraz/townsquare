#!/bin/sh
REPO="https://raw.githubusercontent.com/ThePandemoniumInstitute/botc-release/refs/heads/main/resources"

mkdir -p /app/app/data /app/app/public

download_file() {
    url="$1"
    filename="$2"

    # Make sure the parent directory exists before downloading the file
    mkdir -p "$(dirname "$filename")"

    tmpfile=$(mktemp)
    echo "Downloading $filename"

    # If curl returned a non-zero exit code, print an error message and exit the script
    if ! curl -fLs --retry 3 "$url" -o "$tmpfile"; then
        echo "Error: Failed to download $url"
        rm -f "$tmpfile"
        return 1
    fi

    if [ -f "$filename" ] && cmp -s "$tmpfile" "$filename"; then
        rm -f "$tmpfile"
    else
        echo "Updated: $filename"
        mv "$tmpfile" "$filename"
    fi
}

download_file "$REPO/data/jinxes.json" "/app/app/data/jinxes.json"
download_file "$REPO/data/nightsheet.json" "/app/app/data/nightorder.json"
download_file "$REPO/data/roles.json" "/app/app/data/roles.json"

# Download sprites for each role
mkdir -p "/app/public/sprites/botc"
jq -c '.[]' /app/app/data/roles.json |
while IFS= read -r role; do
    edition=$(printf '%s' "$role" | jq -r '.edition')
    id=$(printf '%s' "$role" | jq -r '.id')

    # Find the correct sprite
    team=$(printf '%s' "$role" | jq -r '.team')
    case "$team" in
        townsfolk|outsider)
            suffix="_g"
            ;;
        demon|minion)
            suffix="_e"
            ;;
        traveller|fabled|loric)
            suffix=""
            ;;
        *)
            echo "Error: Unknown team '$team' for role '$id'"
            exit 1
            ;;
    esac

    download_file "$REPO/characters/$edition/$id$suffix.webp" "/app/public/sprites/characters/$id.webp"
done

# Download sprites for each edition
for edition in tb bmr snv custom taf; do
    mkdir -p "/app/public/sprites/editions/"
    download_file "$REPO/editions/$edition/logo.webp" "/app/public/sprites/editions/$edition.webp"
done

# Download additional sprites
mkdir -p "/app/public/sprites/generic"
for sprite in good evil custom fabled loric; do
    download_file "$REPO/characters/generic/$sprite.webp" "/app/public/sprites/generic/$sprite.webp"
done

# Community content banner
download_file "$REPO/community/ccc-sleeve.png" "/app/public/sprites/ccc.png"

# Download the plus sprite from townsquare
download_file "https://raw.githubusercontent.com/bra1n/townsquare/refs/heads/develop/src/assets/icons/plus.png" "/app/public/sprites/plus.png"
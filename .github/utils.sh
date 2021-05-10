
slack_message() {
    if [ "$#" -eq 2 ]; then
        local channel="$1"
        local plain_message="$2"
    else
        local channel="#valu-search-dev"
        local plain_message="$1"
    fi


    local branch="${GITHUB_REF#refs/heads/}"
    local workflow_url="https://github.com/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
    local commit_url="https://github.com/$GITHUB_REPOSITORY/commits/$GITHUB_SHA"
    local short_commit="$(echo $GITHUB_SHA | head -c 10)"
    local message="[<${commit_url}|\`${short_commit}($branch)\`> <${workflow_url}|log>] $plain_message"

    if [ "${SLACK_WEBHOOK:-}" != "" ]; then
        curl -d @- -X POST -H 'Content-Type: application/json' "$SLACK_WEBHOOK" << JSON
{
  "username": "${GITHUB_ACTOR}@${GITHUB_REPOSITORY}",
  "text": "$message",
}
JSON

      return 0
    fi


    if [ "${SLACK_ACCESS_TOKEN:-}" != "" ]; then
        curl https://slack.com/api/chat.postMessage -F "text=$message" --config - << CONFIG
--silent
--max-time 10
-F token=$SLACK_ACCESS_TOKEN
-F "channel=$channel"
CONFIG
        return 0
    fi


    echo "Cannot send slack message. No SLACK_WEBHOOK or SLACK_ACCESS_TOKEN found"
    return 1

}

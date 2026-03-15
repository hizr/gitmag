#!/bin/bash

SESSION="dev"

# Check if the session already exists to avoid errors
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  # 1. Create the session and name the first window "opencode"
  # -d tells tmux not to attach to the session yet
  tmux new-session -d -s $SESSION -n "opencode"

  # 2. Optional: Send a command to the first window (e.g., open a text editor)
  tmux send-keys -t $SESSION:0 "opencode" C-m

  # 3. Create the second window and name it "fish"
  tmux new-window -t $SESSION:1 -n "fish" "fish"

  # 4. Split window 1 vertically (side-by-side panes)
  # The -h flag splits the width, -v splits the height
  tmux split-window -t $SESSION:1 -h "fish"

  # Optional: Balance the panes so they are exactly 50/50
  tmux select-layout -t $SESSION:1 even-horizontal

fi

# Attach to the session
tmux attach-session -t $SESSION

Feature: Challenge sprint lifecycle

  @challenge
  Scenario: A league host creates and opens a challenge
    Given a league "Pixel League" with host "Jordan"
    When the host creates a challenge "Brand Refresh in 48h" with deadline 48 hours from now
    And the host opens the challenge for submissions
    Then the challenge status is "open"
    And participants can submit entries

  @challenge
  Scenario: A participant submits an entry to an open challenge
    Given an open challenge "Brand Refresh in 48h"
    And a participant "alex" with discipline "design"
    When "alex" submits an artifact URL "https://alex.design/brand-refresh"
    Then the submission is recorded as public
    And the leaderboard shows "alex"

  @challenge
  Scenario: Judges score submissions and a leaderboard is produced
    Given a challenge in "judging" state with 2 submissions
    When a judge scores all submissions
    Then the leaderboard is sorted by score descending
    And scoring is deterministic for equal inputs

  @challenge
  Scenario: Submission rejected when challenge is not open
    Given a challenge in "draft" state
    When a participant attempts to submit
    Then the submission is rejected with reason "challenge not open"

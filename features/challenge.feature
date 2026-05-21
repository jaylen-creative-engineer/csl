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

  @challenge
  Scenario: Multiple judges score a submission without overwriting
    Given a challenge in "judging" state with 1 submissions
    When judge "alpha" scores submission 0 with score 80
    And judge "beta" scores submission 0 with score 60
    Then the leaderboard shows aggregate score 70

  @challenge
  Scenario: A host updates a challenge while in draft
    Given a challenge in "draft" state
    When the host updates the challenge title to "Revised Title"
    Then the challenge title is "Revised Title"

  @challenge
  Scenario: Updating a challenge after opening is rejected
    Given a challenge in "open" state
    When the host attempts to update the challenge title to "Too Late"
    Then the update is rejected

  @challenge
  Scenario: A participant withdraws a submission while challenge is open
    Given an open challenge "Brand Refresh in 48h"
    And a participant "alex" with discipline "design"
    When "alex" submits an artifact URL "https://alex.design/brand-refresh"
    And "alex" withdraws the submission
    Then the submission no longer appears in the challenge list

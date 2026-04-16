Feature: League model and participant enrollment

  @league
  Scenario: A community organizer creates a league
    Given a league host "Jordan" with organization "Design Chicago"
    When Jordan creates league "Pixel League Season 1"
    Then the league exists with status "draft"
    And Jordan is the host

  @league
  Scenario: A creative enrolls in a league
    Given a league "Pixel League Season 1" in draft state
    And a participant "alex" with discipline "design"
    When "alex" enrolls in the league
    Then "alex" appears in the participant list

  @league
  Scenario: Duplicate enrollment is rejected
    Given "alex" is already enrolled in "Pixel League Season 1"
    When "alex" attempts to enroll again
    Then enrollment fails with reason "already enrolled"

  @league
  Scenario: A league host advances a league through its full lifecycle
    Given a league host "Jordan" with organization "Design Chicago"
    When Jordan creates league "Pixel League Season 2"
    Then the league exists with status "draft"
    When the host activates the league
    Then the league exists with status "active"
    When the host closes the league
    Then the league exists with status "closed"

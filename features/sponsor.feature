Feature: Sponsor intelligence

  @sponsor
  Scenario: A sponsor attaches a brief to a challenge
    Given a league "Pixel League" with host "Jordan"
    And the host creates a challenge "Brand Refresh" with deadline 48 hours from now
    And a sponsor "Acme Corp" with contact "acme@example.com"
    When the sponsor attaches a brief to the challenge
    Then the sponsor attachment is recorded with the brief
    And the sponsor summary shows 1 challenge
    And the challenge sponsorId matches the sponsor

  @sponsor
  Scenario: A showcase feed returns paginated results
    Given a league "Pixel League" with host "Jordan"
    And the host creates a challenge "Brand Refresh" with deadline 48 hours from now
    And a participant "alex" with discipline "design"
    And the challenge is completed with scored submissions
    When the showcase feed is requested with limit 1
    Then the feed returns 1 entry and a nextCursor is null

  @sponsor
  Scenario: A sponsor records an outcome after challenge completion
    Given a league "Pixel League" with host "Jordan"
    And the host creates a challenge "Brand Refresh" with deadline 48 hours from now
    And a sponsor "Acme Corp" with contact "acme@example.com"
    And the sponsor attaches a brief to the challenge
    And a participant "alex" with discipline "design"
    And the challenge is completed with scored submissions
    When the sponsor records an outcome of "delivered"
    Then the attachment outcome status is "delivered"

  @sponsor
  Scenario: Sponsor summary includes top submissions from sponsored challenges
    Given a league "Pixel League" with host "Jordan"
    And the host creates a challenge "Brand Refresh" with deadline 48 hours from now
    And a sponsor "Acme Corp" with contact "acme@example.com"
    And the sponsor attaches a brief to the challenge
    And a participant "alex" with discipline "design"
    And the challenge is completed with scored submissions
    When the sponsor summary is requested
    Then the summary includes top submissions from the challenge

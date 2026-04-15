Feature: Showcase and talent signal surface

  @showcase
  Scenario: A participant's portfolio is built from public submissions
    Given "alex" has 3 scored public submissions across 2 challenges
    When the showcase builds alex's portfolio
    Then the portfolio contains 3 entries
    And skill signals reflect the scoring criteria domains

  @showcase
  Scenario: Top performers are surfaced for a league
    Given "Pixel League" with 5 participants and scored submissions
    When top performers are requested with limit 3
    Then exactly 3 profiles are returned ranked by aggregate score

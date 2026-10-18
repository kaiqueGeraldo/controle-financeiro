package com.controlefinanceiro.api.domain.habit;

import org.springframework.test.annotation.DirtiesContext;

/** Counterproof only: retain one context across methods, as the old harness did. */
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class UnisolatedFixtureMutationTest extends HabitFixtureIsolationIntegrationTest {
}

package com.controlefinanceiro.api.infra.operations;

import org.junit.jupiter.api.Test;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.LivenessState;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.sql.DataSource;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class HealthControllerTest {
    @Test void initializingAndMaintenanceDoNotBorrowConnectionsOrRevealDetails() throws Exception {
        var availability = mock(ApplicationAvailability.class);
        var db = mock(DataSource.class);
        when(availability.getReadinessState()).thenReturn(ReadinessState.REFUSING_TRAFFIC);
        when(availability.getLivenessState()).thenReturn(LivenessState.BROKEN);
        var mvc = MockMvcBuilders.standaloneSetup(new HealthController(availability, new OperationsState(true, false), db)).build();
        mvc.perform(get("/ops/health/readiness")).andExpect(status().isServiceUnavailable())
                .andExpect(content().json("{\"status\":\"DOWN\"}", true));
        mvc.perform(get("/ops/health/liveness")).andExpect(status().isServiceUnavailable());
        when(availability.getReadinessState()).thenReturn(ReadinessState.ACCEPTING_TRAFFIC);
        var maintenance = MockMvcBuilders.standaloneSetup(new HealthController(availability, new OperationsState(false, false), db)).build();
        maintenance.perform(get("/ops/health/readiness")).andExpect(status().isServiceUnavailable());
        verifyNoInteractions(db);
    }
}

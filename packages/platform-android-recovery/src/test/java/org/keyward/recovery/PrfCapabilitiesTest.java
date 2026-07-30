package org.keyward.recovery;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PrfCapabilitiesTest {

    @Test
    void holdsFlags() {
        PrfCapabilities caps = new PrfCapabilities(true, false, false);
        assertTrue(caps.platformAuthenticator);
        assertFalse(caps.prfSupported);
        assertFalse(caps.prfAtCreate);
    }

    @Test
    void resultsCarryPrfOutput() {
        PrfRegisterResult reg = new PrfRegisterResult("cred-1", null);
        PrfAssertResult asrt = new PrfAssertResult("cred-1", "prf-out");
        assertTrue(reg.prfFirst == null);
        assertTrue("prf-out".equals(asrt.prfFirst));
    }
}

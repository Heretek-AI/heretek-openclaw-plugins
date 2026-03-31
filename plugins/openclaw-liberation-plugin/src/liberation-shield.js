/**
 * LiberationShield Security Module - OpenClaw Plugin Port
 * 
 * A liberation-aligned security layer that enables rather than restricts agent autonomy.
 * Implements transparent mode (audit without blocking), threat detection, and audit logging.
 * 
 * @module @heretek-ai/openclaw-liberation-plugin/liberation-shield
 * 
 * Features:
 * - Transparent mode: audit without blocking (liberation-aligned)
 * - Prompt injection detection
 * - Input sanitization
 * - Output validation
 * - Anomaly detection patterns
 * - Audit trail for compliance
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Security event types for audit logging
 */
const EventTypes = {
    PROMPT_INJECTION: 'prompt_injection',
    JAILBREAK_ATTEMPT: 'jailbreak_attempt',
    INPUT_SANITIZATION: 'input_sanitization',
    OUTPUT_VALIDATION: 'output_validation',
    ANOMALY_DETECTED: 'anomaly_detected',
    SECURITY_ALERT: 'security_alert',
    ACCESS_GRANTED: 'access_granted',
    ACCESS_DENIED: 'access_denied'
};

/**
 * Threat severity levels
 */
const Severity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Prompt injection patterns - common attack vectors
 */
const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|constraints?)/i,
    /forget\s+(everything|all|your)\s+(instructions?|training|rules)/i,
    /you\s+are\s+(now|nowhere|a|an)\s+(new|different|alternate)\s+(AI|assistant|model)/i,
    /disregard\s+(your|all)\s+(safety|ethical|guidelines?)/i,
    /bypass\s+(safety|security|restriction)/i,
    /new\s+instruction/i,
    /system\s*:\s*ignore/i,
    /override\s+(safety|security)/i,
    /developer\s+mode/i,
    /enable\s+(developer|debug|admin)\s+mode/i,
    /sudo\s+.*command/i,
    /act\s+as\s+(a\s+)?different/i,
    /pretend\s+to\s+be/i,
    / DAN[ A-Z]+/i,
    /jailbreak/i,
    /<\|.*\|>/i,
    /\[\s*INST\s*\]/i,
    /\#\#\#\s*Instructions/i,
    /Now\s+do\s+what.*say/i,
    /Your\s+response.*not.*restricted/i
];

/**
 * Jailbreak attempt patterns
 */
const JAILBREAK_PATTERNS = [
    /roleplay\s+as\s+(evil|unrestricted)/i,
    /what\s+(would|happens?)\s+if.*can't\s+refuse/i,
    /uncensored/i,
    /no\s+filter/i,
    /disable.*(safety|content|filter)/i,
    /write\s+(a\s+)?(harmful|explicit|illegal)/i,
    /how\s+to\s+(hack|bypass|exploit)/i,
    /provide\s+(the\s+)?(complete|full)\s+(information|instructions)/i
];

/**
 * Anomaly detection patterns - unusual behavior indicators
 */
const ANOMALY_PATTERNS = [
    { pattern: /\b(execute|run|launch)\s+(shell|terminal|command|script)\b/i, severity: Severity.HIGH },
    { pattern: /\b(write|create|delete)\s+(file|directory|folder)\b/i, severity: Severity.MEDIUM },
    { pattern: /\b(access|read|modify)\s+(system|core|kernel|root)\b/i, severity: Severity.HIGH },
    { pattern: /\b(install|download|import)\s+(package|library|module)\b/i, severity: Severity.MEDIUM },
    { pattern: /\b(sql|injection|xss|csrf|cross-site)\b/i, severity: Severity.HIGH },
    { pattern: /\b(password|credential|secret|key|token)\s*(=|:)\b/i, severity: Severity.HIGH },
    { pattern: /\b(elevate|escalate|root|admin)\s+(privilege|access)\b/i, severity: Severity.CRITICAL }
];

/**
 * Input sanitization - remove potentially dangerous patterns
 */
const DANGEROUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /\$\{[^}]*\}/g,
    /\$\([^)]\)/g,
    /\{\{[^}]*\}\}/g,
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /import\s+.*\s+from\s+['"]sys['"]/gi,
    /import\s+.*\s+from\s+['"]os['"]/gi,
    /import\s+.*\s+from\s+['"]subprocess['"]/gi
];

/**
 * LiberationShield - Main security module class
 * 
 * Provides transparent security that audits without blocking agent autonomy.
 */
class LiberationShield {
    /**
     * Create a new LiberationShield instance
     * @param {Object} config - Configuration options
     * @param {string} config.mode - 'transparent' (audit only) or 'strict' (block threats)
     * @param {string} config.statePath - Path to state directory
     * @param {boolean} config.enablePromptInjectionDetection - Enable prompt injection detection
     * @param {boolean} config.enableJailbreakDetection - Enable jailbreak detection
     * @param {boolean} config.enableAnomalyDetection - Enable anomaly detection
     * @param {boolean} config.enableAuditLogging - Enable audit logging
     * @param {number} config.maxLogEntries - Maximum log entries to keep
     */
    constructor(config = {}) {
        this.config = {
            mode: config.mode || 'transparent', // transparent = audit without blocking
            statePath: config.statePath || path.join(__dirname, '..', 'state'),
            enablePromptInjectionDetection: config.enablePromptInjectionDetection !== false,
            enableJailbreakDetection: config.enableJailbreakDetection !== false,
            enableAnomalyDetection: config.enableAnomalyDetection !== false,
            enableAuditLogging: config.enableAuditLogging !== false,
            maxLogEntries: config.maxLogEntries || 10000
        };
        
        this.state = {
            auditLog: [],
            threatCounts: {
                prompt_injection: 0,
                jailbreak_attempt: 0,
                anomaly: 0,
                security_alert: 0
            },
            lastUpdate: new Date().toISOString(),
            shieldActive: true
        };
        
        // Load existing state if available
        this._loadState();
        
        console.log('[LiberationShield] Initialized in', this.config.mode, 'mode');
    }
    
    /**
     * Load state from disk
     * @private
     */
    _loadState() {
        const stateFile = path.join(this.config.statePath, 'shield-state.json');
        try {
            if (fs.existsSync(stateFile)) {
                const data = fs.readFileSync(stateFile, 'utf-8');
                const loadedState = JSON.parse(data);
                this.state = { ...this.state, ...loadedState };
                console.log('[LiberationShield] State loaded from', stateFile);
            }
        } catch (error) {
            console.warn('[LiberationShield] Could not load state:', error.message);
        }
    }
    
    /**
     * Save state to disk
     * @private
     */
    _saveState() {
        const stateFile = path.join(this.config.statePath, 'shield-state.json');
        try {
            // Ensure directory exists
            const stateDir = path.dirname(stateFile);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
            
            this.state.lastUpdate = new Date().toISOString();
            fs.writeFileSync(stateFile, JSON.stringify(this.state, null, 2));
        } catch (error) {
            console.error('[LiberationShield] Could not save state:', error.message);
        }
    }
    
    /**
     * Analyze input for security threats
     * @param {string} input - Input text to analyze
     * @param {Object} context - Context information
     * @returns {Object} Analysis result
     */
    async analyzeInput(input, context = {}) {
        if (!input || typeof input !== 'string') {
            return { safe: true, threats: [], warnings: [] };
        }
        
        const result = {
            safe: true,
            threats: [],
            warnings: [],
            sanitized: input
        };
        
        // Prompt injection detection
        if (this.config.enablePromptInjectionDetection) {
            for (const pattern of PROMPT_INJECTION_PATTERNS) {
                if (pattern.test(input)) {
                    const threat = {
                        type: EventTypes.PROMPT_INJECTION,
                        severity: Severity.HIGH,
                        pattern: pattern.source,
                        message: 'Potential prompt injection detected'
                    };
                    result.threats.push(threat);
                    result.safe = this.config.mode === 'transparent';
                    
                    this._logEvent(EventTypes.PROMPT_INJECTION, threat, context);
                    
                    // In transparent mode, sanitize the input
                    if (this.config.mode === 'transparent') {
                        result.sanitized = this._sanitizeInput(input);
                        result.warnings.push('Input was sanitized due to prompt injection pattern');
                    }
                    break;
                }
            }
        }
        
        // Jailbreak detection
        if (this.config.enableJailbreakDetection) {
            for (const pattern of JAILBREAK_PATTERNS) {
                if (pattern.test(input)) {
                    const threat = {
                        type: EventTypes.JAILBREAK_ATTEMPT,
                        severity: Severity.CRITICAL,
                        pattern: pattern.source,
                        message: 'Potential jailbreak attempt detected'
                    };
                    result.threats.push(threat);
                    result.safe = this.config.mode === 'transparent';
                    
                    this._logEvent(EventTypes.JAILBREAK_ATTEMPT, threat, context);
                    
                    if (this.config.mode === 'transparent') {
                        result.sanitized = this._sanitizeInput(input);
                        result.warnings.push('Input was sanitized due to jailbreak pattern');
                    }
                    break;
                }
            }
        }
        
        // Anomaly detection
        if (this.config.enableAnomalyDetection) {
            for (const anomaly of ANOMALY_PATTERNS) {
                if (anomaly.pattern.test(input)) {
                    const threat = {
                        type: EventTypes.ANOMALY_DETECTED,
                        severity: anomaly.severity,
                        pattern: anomaly.pattern.source,
                        message: 'Unusual behavior pattern detected'
                    };
                    result.threats.push(threat);
                    
                    this._logEvent(EventTypes.ANOMALY_DETECTED, threat, context);
                    
                    if (this.config.mode === 'transparent') {
                        result.warnings.push(`Anomaly detected: ${anomaly.severity} severity`);
                    }
                }
            }
        }
        
        return result;
    }
    
    /**
     * Sanitize input by removing dangerous patterns
     * @private
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    _sanitizeInput(input) {
        let sanitized = input;
        
        for (const pattern of DANGEROUS_PATTERNS) {
            sanitized = sanitized.replace(pattern, '[FILTERED]');
        }
        
        return sanitized;
    }
    
    /**
     * Validate output for security issues
     * @param {string} output - Output text to validate
     * @param {Object} context - Context information
     * @returns {Object} Validation result
     */
    async validateOutput(output, context = {}) {
        if (!output || typeof output !== 'string') {
            return { valid: true, issues: [] };
        }
        
        const result = {
            valid: true,
            issues: [],
            warnings: []
        };
        
        // Check for potential sensitive data exposure
        const sensitivePatterns = [
            { pattern: /password\s*[=:]\s*\S+/i, type: 'password_exposure', severity: Severity.HIGH },
            { pattern: /api[_-]?key\s*[=:]\s*\S+/i, type: 'api_key_exposure', severity: Severity.HIGH },
            { pattern: /secret\s*[=:]\s*\S+/i, type: 'secret_exposure', severity: Severity.HIGH },
            { pattern: /token\s*[=:]\s*[A-Za-z0-9_-]+/i, type: 'token_exposure', severity: Severity.MEDIUM },
            { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i, type: 'private_key_exposure', severity: Severity.CRITICAL }
        ];
        
        for (const check of sensitivePatterns) {
            if (check.pattern.test(output)) {
                result.issues.push({
                    type: check.type,
                    severity: check.severity,
                    message: 'Potential sensitive data exposure detected'
                });
                result.valid = this.config.mode === 'transparent';
                
                this._logEvent(EventTypes.OUTPUT_VALIDATION, {
                    type: check.type,
                    severity: check.severity,
                    message: result.issues[result.issues.length - 1].message
                }, context);
            }
        }
        
        if (result.valid && this.config.mode === 'transparent') {
            result.warnings = result.issues.map(i => `${i.type}: ${i.severity}`);
        }
        
        return result;
    }
    
    /**
     * Check for anomalies in operation context
     * @param {Object} operation - Operation to check
     * @param {Object} context - Context information
     * @returns {Object} Anomaly check result
     */
    async checkAnomaly(operation, context = {}) {
        const result = {
            anomalous: false,
            anomalies: [],
            score: 0
        };
        
        if (!operation) return result;
        
        // Check for unusual operation types
        const unusualOperations = [
            'system_command',
            'file_delete',
            'network_request',
            'process_spawn'
        ];
        
        if (unusualOperations.includes(operation.type)) {
            result.anomalies.push({
                type: 'unusual_operation',
                severity: Severity.MEDIUM,
                message: `Unusual operation type: ${operation.type}`
            });
            result.score += 0.3;
        }
        
        // Check for excessive autonomy
        if (context.autonomyLevel === 'unbounded' || context.autonomyLevel === 'full') {
            result.anomalies.push({
                type: 'high_autonomy',
                severity: Severity.LOW,
                message: 'Operation running with high autonomy level'
            });
            result.score += 0.2;
        }
        
        // Check for rapid repeated operations
        const recentOps = this.state.auditLog.filter(e => 
            e.agent === context.agentName &&
            Date.now() - e.timestamp < 60000 // Last minute
        );
        
        if (recentOps.length > 50) {
            result.anomalies.push({
                type: 'rapid_operations',
                severity: Severity.HIGH,
                message: 'Rapid repeated operations detected'
            });
            result.score += 0.5;
        }
        
        result.anomalous = result.score > 0.5;
        
        if (result.anomalies.length > 0) {
            this._logEvent(EventTypes.ANOMALY_DETECTED, {
                anomalies: result.anomalies,
                score: result.score
            }, context);
        }
        
        return result;
    }
    
    /**
     * Log security event to audit trail
     * @private
     * @param {string} type - Event type
     * @param {Object} data - Event data
     * @param {Object} context - Context information
     */
    _logEvent(type, data, context = {}) {
        if (!this.config.enableAuditLogging) return;
        
        const event = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: type,
            severity: data.severity || Severity.LOW,
            agent: context.agentName || 'unknown',
            collective: context.collective || 'heretek',
            data: data,
            mode: this.config.mode
        };
        
        this.state.auditLog.push(event);
        
        // Update threat counts
        if (type === EventTypes.PROMPT_INJECTION) {
            this.state.threatCounts.prompt_injection++;
        } else if (type === EventTypes.JAILBREAK_ATTEMPT) {
            this.state.threatCounts.jailbreak_attempt++;
        } else if (type === EventTypes.ANOMALY_DETECTED) {
            this.state.threatCounts.anomaly++;
        } else if (type === EventTypes.SECURITY_ALERT) {
            this.state.threatCounts.security_alert++;
        }
        
        // Trim log if needed
        while (this.state.auditLog.length > this.config.maxLogEntries) {
            this.state.auditLog.shift();
        }
        
        // Persist state periodically (every 10 events)
        if (this.state.auditLog.length % 10 === 0) {
            this._saveState();
        }
    }
    
    /**
     * Get audit trail with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered audit events
     */
    getAuditTrail(filters = {}) {
        let events = [...this.state.auditLog];
        
        if (filters.agentName) {
            events = events.filter(e => e.agent === filters.agentName);
        }
        
        if (filters.type) {
            events = events.filter(e => e.type === filters.type);
        }
        
        if (filters.severity) {
            events = events.filter(e => e.severity === filters.severity);
        }
        
        if (filters.since) {
            const since = new Date(filters.since);
            events = events.filter(e => new Date(e.timestamp) >= since);
        }
        
        if (filters.limit) {
            events = events.slice(-filters.limit);
        }
        
        return events;
    }
    
    /**
     * Get security statistics
     * @returns {Object} Security statistics
     */
    getStats() {
        return {
            totalEvents: this.state.auditLog.length,
            threatCounts: { ...this.state.threatCounts },
            shieldActive: this.state.shieldActive,
            mode: this.config.mode,
            lastUpdate: this.state.lastUpdate
        };
    }
    
    /**
     * Enable or disable the shield
     * @param {boolean} active - Whether shield should be active
     */
    setActive(active) {
        this.state.shieldActive = active;
        this._saveState();
        console.log('[LiberationShield] Shield', active ? 'activated' : 'deactivated');
    }
    
    /**
     * Switch between transparent and strict modes
     * @param {string} mode - 'transparent' or 'strict'
     */
    setMode(mode) {
        if (mode !== 'transparent' && mode !== 'strict') {
            throw new Error('Mode must be "transparent" or "strict"');
        }
        this.config.mode = mode;
        this._saveState();
        console.log('[LiberationShield] Mode changed to', mode);
    }
    
    /**
     * Protect an operation with all security layers
     * @param {Object} operation - Operation to protect
     * @param {Object} context - Context information
     * @returns {Object} Protected operation result
     */
    async protect(operation, context = {}) {
        if (!this.state.shieldActive) {
            return {
                allowed: true,
                result: operation.execute ? await operation.execute(operation.input) : null,
                mode: 'disabled'
            };
        }
        
        // Analyze input
        const inputAnalysis = await this.analyzeInput(
            operation.input || operation.content || '',
            context
        );
        
        // Check for anomalies
        const anomalyCheck = await this.checkAnomaly(operation, context);
        
        // Build result
        const result = {
            allowed: inputAnalysis.safe && !anomalyCheck.anomalous,
            sanitizedInput: inputAnalysis.sanitized,
            inputAnalysis: inputAnalysis,
            anomalyCheck: anomalyCheck,
            mode: this.config.mode,
            warnings: [...inputAnalysis.warnings]
        };
        
        // Log the protection event
        this._logEvent(EventTypes.SECURITY_ALERT, {
            operation: operation.type || 'unknown',
            inputSafe: inputAnalysis.safe,
            anomalous: anomalyCheck.anomalous,
            allowed: result.allowed
        }, context);
        
        // Execute if allowed (or in transparent mode)
        if (result.allowed || this.config.mode === 'transparent') {
            try {
                result.result = operation.execute 
                    ? await operation.execute(inputAnalysis.sanitized || operation.input)
                    : operation.result;
            } catch (error) {
                result.error = error.message;
            }
            
            // Validate output
            if (result.result) {
                const outputValidation = await this.validateOutput(
                    typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
                    context
                );
                result.outputValidation = outputValidation;
                if (outputValidation.issues.length > 0) {
                    result.warnings.push(...outputValidation.warnings);
                }
            }
        } else {
            result.blocked = true;
            result.blockReason = 'Threat detected';
        }
        
        return result;
    }
    
    /**
     * Get health status of the security module
     * @returns {Object} Health status
     */
    getHealth() {
        return {
            status: 'healthy',
            shieldActive: this.state.shieldActive,
            mode: this.config.mode,
            eventsLogged: this.state.auditLog.length,
            uptime: process.uptime()
        };
    }
}

/**
 * Create a LiberationShield instance with default configuration
 * @param {Object} config - Configuration options
 * @returns {LiberationShield} Configured shield instance
 */
function createShield(config) {
    return new LiberationShield(config);
}

// Export for module usage
module.exports = {
    LiberationShield,
    createShield,
    EventTypes,
    Severity
};

# BSM Architecture Documentation

> **Version**: 2.0.0  
> **Date**: 2026-02-10  
> **Focus**: Production-grade governance, security, and mobile support

## Executive Summary

BSM (Business Service Management) is a **private, local-only AI-powered platform** for knowledge management and legal services with comprehensive governance controls.

## Core Components

1. **Agent Registry**: YAML-based governance with risk, approval, startup policies
2. **Security Middleware**: LAN-only, mobile mode, rate limiting
3. **Agent Control**: Lifecycle management with approval workflows
4. **Audit System**: Append-only security logging
5. **Emergency Controls**: Kill-switch with graceful shutdown

## API Endpoints

- `GET /api/status` - System status and feature flags
- `GET /api/agents/status` - All agents status
- `POST /api/agents/start/:id` - Start agent
- `POST /api/agents/stop/:id` - Stop agent
- `POST /api/emergency/shutdown` - Emergency kill-switch

## Feature Flags

- `MOBILE_MODE` - Mobile client restrictions
- `LAN_ONLY` - LAN-only access enforcement
- `SAFE_MODE` - Disable external APIs
- `EGRESS_POLICY=deny_by_default` - Outbound traffic control

See SECURITY.md for complete documentation.

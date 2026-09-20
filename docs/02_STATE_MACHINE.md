# State Machine

NORMAL
  -> REQUEST_PENDING
  -> VERIFIED_WAITING_APPROVAL
  -> APPROVED
  -> GREEN_CORRIDOR
  -> RESTORING_NORMAL
  -> NORMAL

Invalid approval without a verified pending request:
  -> reject
  -> log action
  -> remain in current safe state

Any hardware/communication fault:
  -> FAULT
  -> inhibit unsafe transitions
  -> log fault

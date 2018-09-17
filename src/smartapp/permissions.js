module.exports = {
  LocationRestrictions: {
    NEARBY: 'LocationRestrictions_NEARBY',
    AT_HOME: 'LocationRestrictions_AT_HOME',
    ANYWHERE: 'LocationRestrictions_ANYWHERE'
  },
  ParentalRestrictions: {
    ALLOW_IF_NEARBY: 'ParentalRestrictions_ALLOW_IF_NEARBY',
    ALWAYS_ASK: 'ParentalRestrictions_ALWAYS_ASK',
    DENY: 'ParentalRestrictions_DENY'
  },
  ApprovalState: {
    PENDING: 'ApprovalState_PENDING',
    ALLOW: 'ApprovalState_ALLOW',
    DENY: 'ApprovalState_DENY',
    TIMEOUT: 'ApprovalState_TIMEOUT',
    PROMPT: 'ApprovalState_PROMPT',
  },
  ApprovalType: {
    NEARBY: 'ApprovalType_NEARBY',
    OWNERS: 'ApprovalType_OWNERS'
  }
}
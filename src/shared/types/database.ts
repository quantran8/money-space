export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type HouseholdRole = 'owner' | 'partner' | 'viewer'
type PermissionLevel =
  | 'view_summary'
  | 'view_grouped'
  | 'view_detail'
  | 'edit_content'
  | 'admin'
type UpdateFrequency = 'weekly' | 'monthly' | 'manual'
type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
type SnapshotStatus = 'good' | 'attention' | 'tight' | 'insufficient_data'
type SnapshotSourceMode = 'manual' | 'calculated' | 'mixed'
type AssetType =
  | 'cash'
  | 'bank_account'
  | 'saving_deposit'
  | 'bond'
  | 'gold'
  | 'stock'
  | 'fund'
  | 'crypto'
  | 'foreign_currency'
  | 'real_estate'
  | 'insurance'
  | 'loan_receivable'
  | 'certificate_of_deposit'
  | 'investment'
  | 'other'
type AssetValuationMode = 'manual' | 'market_priced' | 'formula_calculated'
type AssetLiquidity = 'usable_now' | 'not_immediately_usable' | 'long_term'
type VisibilityLevel = 'summary_only' | 'grouped' | 'detail' | 'private'
type AssetClass = 'gold' | 'crypto' | 'stock' | 'fund' | 'foreign_currency'
type AssetCalculationType =
  | 'saving_deposit'
  | 'bond'
  | 'loan_receivable'
  | 'certificate_of_deposit'
  | 'custom_interest'
type InterestRateType = 'fixed' | 'floating'
type CompoundingFrequency = 'none' | 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'at_maturity'
type PayoutFrequency = 'at_maturity' | 'monthly' | 'quarterly' | 'yearly'
type AssetCalculationStatus = 'active' | 'matured' | 'closed' | 'cancelled'
type AssetValuationMethod =
  | 'manual'
  | 'market_price_api'
  | 'formula_calculated'
  | 'statement'
  | 'appraised'
  | 'other'
type ConfidenceLevel = 'low' | 'medium' | 'high'
type PaymentFrequency = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
type PaymentStatus = 'unpaid' | 'paid' | 'pending_confirmation' | 'postponed' | 'overdue'
type AttentionLevel = 'normal' | 'important' | 'urgent'
type DebtType =
  | 'family_loan'
  | 'friend_loan'
  | 'bank_loan'
  | 'consumer_finance'
  | 'mortgage'
  | 'credit_card'
  | 'installment'
  | 'other'
type LenderType = 'family' | 'friend' | 'bank' | 'credit_institution' | 'company' | 'other'
type DebtStatus = 'active' | 'paid_off' | 'paused' | 'overdue' | 'cancelled'
type DebtRepaymentType =
  | 'flexible'
  | 'fixed_schedule'
  | 'installment'
  | 'interest_only'
  | 'minimum_payment'
  | 'bullet_payment'
type DebtPrincipalPaymentType = 'flexible' | 'equal_principal' | 'equal_payment' | 'custom'
type DebtInterestType = 'none' | 'fixed' | 'floating' | 'staged'
type DebtInterestCalculation = 'simple_interest' | 'reducing_balance' | 'flat_rate' | 'custom'
type DebtInterestRateType = 'fixed' | 'floating' | 'promotional' | 'adjusted'
type MoneyEventType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'asset_purchase'
  | 'asset_sale'
  | 'asset_update'
  | 'payment_paid'
  | 'goal_contribution'
  | 'debt_update'
  | 'adjustment'
  | 'other'
type MoneyEventCategory =
  | 'housing'
  | 'education'
  | 'transport'
  | 'health'
  | 'family_support'
  | 'insurance'
  | 'saving'
  | 'investment'
  | 'debt'
  | 'income'
  | 'repair'
  | 'household'
  | 'children'
  | 'travel'
  | 'other'
type MoneyDirection = 'inflow' | 'outflow' | 'neutral'
type MoneyEventStatus = 'recorded' | 'pending_confirmation' | 'cancelled'
type GoalCategory =
  | 'emergency_fund'
  | 'home'
  | 'home_repair'
  | 'children'
  | 'travel'
  | 'debt_repayment'
  | 'investment'
  | 'education'
  | 'other'
type GoalPriority = 'low' | 'medium' | 'high'
type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled'
type RelatedObjectType =
  | 'asset'
  | 'upcoming_payment'
  | 'financial_goal'
  | 'snapshot'
  | 'money_event'
  | 'debt'
type AttentionItemStatus = 'open' | 'seen' | 'resolved' | 'dismissed'

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
}

type Timestamped = {
  created_at: string
}

type SoftDeleted = {
  deleted_at: string | null
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Timestamped & {
          id: string
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          email: string | null
          phone: string | null
          updated_at: string
        },
        {
          id: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      >
      households: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            name: string
            currency: string
            update_frequency: UpdateFrequency
            created_by: string
            updated_at: string
          },
        {
          id?: string
          name: string
          currency?: string
          update_frequency?: UpdateFrequency
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      >
      household_members: Table<
        Timestamped & {
          id: string
          household_id: string
          user_id: string
          role: HouseholdRole
          permission_level: PermissionLevel
          joined_at: string
          invited_by: string | null
          updated_at: string
        },
        {
          id?: string
          household_id: string
          user_id: string
          role?: HouseholdRole
          permission_level?: PermissionLevel
          joined_at?: string
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      >
      household_invites: Table<
        Timestamped & {
          id: string
          household_id: string
          invited_by: string
          invitee_email: string | null
          invitee_phone: string | null
          token: string
          status: InviteStatus
          default_role: HouseholdRole
          default_permission_level: PermissionLevel
          expires_at: string
          accepted_by: string | null
          accepted_at: string | null
          updated_at: string
        }
      >
      snapshots: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            snapshot_date: string
            total_liquid: number
            total_savings: number
            total_long_term_assets: number
            total_debt: number
            upcoming_due_amount: number
            attention_count: number
            status: SnapshotStatus
            source_mode: SnapshotSourceMode
            note: string | null
            created_by: string
          }
      >
      assets: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            name: string
            type: AssetType
            valuation_mode: AssetValuationMode
            current_value: number
            currency: string
            value_updated_at: string | null
            holder_member_id: string | null
            liquidity: AssetLiquidity
            purpose: string | null
            visibility_level: VisibilityLevel
            note: string | null
            created_by: string
            updated_by: string | null
            updated_at: string
          }
      >
      asset_market_positions: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            asset_id: string
            symbol: string | null
            market: string | null
            asset_class: AssetClass
            quantity: number
            unit: string | null
            quote_currency: string
            price_source: string | null
            price_source_symbol: string | null
            last_price: number | null
            last_price_at: string | null
            updated_at: string
          }
      >
      market_prices: Table<
        Timestamped & {
          id: string
          asset_class: AssetClass
          symbol: string
          market: string | null
          quote_currency: string
          price: number
          price_time: string
          source: string
          source_payload_hash: string | null
        }
      >
      fx_rates: Table<
        Timestamped & {
          id: string
          base_currency: string
          quote_currency: string
          rate: number
          rate_time: string
          source: string
        }
      >
      asset_calculation_terms: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            asset_id: string
            calculation_type: AssetCalculationType
            principal_amount: number
            currency: string
            start_date: string
            maturity_date: string | null
            interest_rate: number | null
            interest_rate_type: InterestRateType | null
            compounding_frequency: CompoundingFrequency | null
            payout_frequency: PayoutFrequency | null
            coupon_rate: number | null
            coupon_frequency: PayoutFrequency | null
            expected_return_rate: number | null
            status: AssetCalculationStatus
            updated_at: string
          }
      >
      asset_valuations: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            asset_id: string
            value: number
            currency: string
            valuation_date: string
            valuation_method: AssetValuationMethod
            source: string | null
            confidence_level: ConfidenceLevel | null
            market_price_id: string | null
            fx_rate_id: string | null
            calculation_term_id: string | null
            note: string | null
            created_by: string | null
            updated_by: string | null
            updated_at: string
          }
      >
      snapshot_asset_values: Table<
        Timestamped & {
          id: string
          household_id: string
          snapshot_id: string
          asset_id: string
          asset_name: string
          asset_type: AssetType
          liquidity: AssetLiquidity
          value: number
          currency: string
          valuation_id: string | null
          valuation_method: AssetValuationMethod | null
          valuation_date: string | null
          visibility_level: VisibilityLevel
        }
      >
      debts: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            name: string
            debt_type: DebtType
            lender_type: LenderType
            lender_name: string | null
            original_amount: number
            outstanding_amount: number
            currency: string
            borrowed_at: string | null
            expected_final_due_date: string | null
            status: DebtStatus
            owner_member_id: string | null
            received_to_asset_id: string | null
            note: string | null
            created_by: string | null
            updated_by: string | null
            updated_at: string | null
          }
      >
      debt_terms: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            debt_id: string
            repayment_type: DebtRepaymentType
            principal_payment_type: DebtPrincipalPaymentType | null
            payment_frequency: PaymentFrequency | 'none' | 'custom' | null
            fixed_payment_amount: number | null
            minimum_payment_amount: number | null
            start_date: string | null
            end_date: string | null
            has_interest: boolean
            interest_type: DebtInterestType
            interest_calculation: DebtInterestCalculation | null
            grace_period_months: number | null
            updated_at: string | null
          }
      >
      debt_interest_periods: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            debt_id: string
            start_date: string
            end_date: string | null
            interest_rate: number
            rate_type: DebtInterestRateType
            note: string | null
            updated_at: string | null
          }
      >
      upcoming_payments: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            name: string
            amount: number
            due_date: string
            frequency: PaymentFrequency
            auto_create_next: boolean
            owner_member_id: string | null
            debt_id: string | null
            status: PaymentStatus
            attention_level: AttentionLevel
            is_attention_needed: boolean
            note: string | null
            paid_at: string | null
            paid_by: string | null
            paid_amount: number | null
            paid_from_asset_id: string | null
            created_by: string
            updated_by: string | null
            updated_at: string
          }
      >
      financial_goals: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            name: string
            category: GoalCategory
            target_amount: number
            current_amount: number
            deadline: string | null
            priority: GoalPriority
            status: GoalStatus
            linked_asset_id: string | null
            note: string | null
            created_by: string
            updated_by: string | null
            updated_at: string
          }
      >
      money_events: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            title: string
            description: string | null
            event_type: MoneyEventType
            category: MoneyEventCategory
            amount: number
            currency: string
            event_date: string
            direction: MoneyDirection
            from_asset_id: string | null
            to_asset_id: string | null
            upcoming_payment_id: string | null
            debt_id: string | null
            financial_goal_id: string | null
            snapshot_id: string | null
            is_large_event: boolean
            is_attention_needed: boolean
            visibility_level: VisibilityLevel
            status: MoneyEventStatus
            created_by: string
            updated_by: string | null
            updated_at: string
          }
      >
      attention_items: Table<
        Timestamped &
          SoftDeleted & {
            id: string
            household_id: string
            title: string
            reason: string | null
            amount: number | null
            related_object_type: RelatedObjectType | null
            related_object_id: string | null
            level: AttentionLevel
            status: AttentionItemStatus
            visibility_level: VisibilityLevel
            created_by: string
            seen_by: string | null
            seen_at: string | null
            resolved_by: string | null
            resolved_at: string | null
          }
      >
      audit_logs: Table<
        Timestamped & {
          id: string
          household_id: string
          actor_id: string
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json
        }
      >
    }
    Views: Record<string, never>
    Functions: {
      can_edit_household: {
        Args: { target_household_id: string }
        Returns: boolean
      }
      is_household_member: {
        Args: { target_household_id: string }
        Returns: boolean
      }
    }
    Enums: {
      household_role: HouseholdRole
      permission_level: PermissionLevel
      update_frequency: UpdateFrequency
      invite_status: InviteStatus
      snapshot_status: SnapshotStatus
      snapshot_source_mode: SnapshotSourceMode
      asset_type: AssetType
      asset_valuation_mode: AssetValuationMode
      asset_liquidity: AssetLiquidity
      visibility_level: VisibilityLevel
      asset_class: AssetClass
      asset_calculation_type: AssetCalculationType
      interest_rate_type: InterestRateType
      compounding_frequency: CompoundingFrequency
      payout_frequency: PayoutFrequency
      asset_calculation_status: AssetCalculationStatus
      asset_valuation_method: AssetValuationMethod
      confidence_level: ConfidenceLevel
      payment_frequency: PaymentFrequency
      payment_status: PaymentStatus
      attention_level: AttentionLevel
      debt_type: DebtType
      lender_type: LenderType
      debt_status: DebtStatus
      debt_repayment_type: DebtRepaymentType
      debt_principal_payment_type: DebtPrincipalPaymentType
      debt_interest_type: DebtInterestType
      debt_interest_calculation: DebtInterestCalculation
      debt_interest_rate_type: DebtInterestRateType
      money_event_type: MoneyEventType
      money_event_category: MoneyEventCategory
      money_direction: MoneyDirection
      money_event_status: MoneyEventStatus
      goal_category: GoalCategory
      goal_priority: GoalPriority
      goal_status: GoalStatus
      related_object_type: RelatedObjectType
      attention_item_status: AttentionItemStatus
    }
  }
}

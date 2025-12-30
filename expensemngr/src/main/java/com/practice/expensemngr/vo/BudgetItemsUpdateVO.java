package io.saadmughal.assignment05.vo;


import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@Data
@EqualsAndHashCode(callSuper = false)
public class BudgetItemsUpdateVO extends BudgetItemsVO implements Serializable {
    private static final long serialVersionUID = 1L;

}
